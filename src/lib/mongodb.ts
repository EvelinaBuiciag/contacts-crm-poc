import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined. Please set it in your .env file.');
}

console.log('MongoDB connection string exists:', !!MONGODB_URI);

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  try {
    console.log('Starting MongoDB connection...');
    console.log('Current connection state:', mongoose.connection.readyState);
    
    if (cached.conn) {
      // Check if the connection is still alive
      if (mongoose.connection.readyState === 1) {
        console.log('Using cached database connection');
        return cached.conn;
      }
      console.log('Cached connection is not active, creating new connection');
      // Reset cache if connection is not active
      cached.conn = null;
      cached.promise = null;
    }

    if (!cached.promise) {
      console.log('Creating new database connection...');
      const opts = {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
        maxPoolSize: 10,
        minPoolSize: 5,
        retryWrites: true,
        retryReads: true,
      };

      console.log('Connection options:', JSON.stringify(opts, null, 2));

      cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
        console.log('Successfully connected to MongoDB');
        console.log('Connection state after connect:', mongoose.connection.readyState);
        
        // Handle connection errors
        mongoose.connection.on('error', (error) => {
          console.error('MongoDB connection error:', error);
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          cached.conn = null;
          cached.promise = null;
        });

        // Handle disconnection
        mongoose.connection.on('disconnected', () => {
          console.log('MongoDB disconnected');
          console.log('Connection state after disconnect:', mongoose.connection.readyState);
          cached.conn = null;
          cached.promise = null;
        });

        // Handle successful reconnection
        mongoose.connection.on('reconnected', () => {
          console.log('MongoDB reconnected');
          console.log('Connection state after reconnect:', mongoose.connection.readyState);
        });

        return mongoose;
      }).catch((error) => {
        console.error('Failed to connect to MongoDB:', error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        cached.promise = null;
        throw error;
      });
    }

    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (e) {
      cached.promise = null;
      console.error('Error establishing database connection:', e);
      if (e instanceof Error) {
        console.error('Error details:', {
          name: e.name,
          message: e.message,
          stack: e.stack
        });
      }
      throw e;
    }
  } catch (error) {
    console.error('Top level error in connectDB:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}

export default connectDB; 