import { IntegrationList } from "./components/integrations-list"

export default function Integrations() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Integrations
        </h1>
        <p className="mt-2 text-muted-foreground">
          Connect to your CRMs to automatically sync and manage all your contacts in one place.
        </p>
      </div>
      <IntegrationList />
    </div>
  )
}
