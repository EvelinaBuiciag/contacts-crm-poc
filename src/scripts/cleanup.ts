const { Contact } = require('../models/contact');
const connectDB = require('../lib/mongodb').default;

async function cleanup() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected to database');

    // Find the problematic contact (the one with repeated name)
    const contact = await Contact.findOne({
      name: /Luis Herman/i,
    });

    if (contact) {
      console.log('Found problematic contact:', contact);
      await Contact.findByIdAndDelete(contact._id);
      console.log('Successfully deleted the problematic contact');
    } else {
      console.log('No problematic contact found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanup(); 