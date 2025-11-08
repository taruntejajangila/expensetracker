export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
        <p className="text-gray-600">Review recent backend events, deployment information, and error traces.</p>
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-500">
        <p className="text-lg font-medium">Logs coming soon</p>
        <p className="text-sm">We’re wiring the real-time log feed. For now, please use the Railway logs panel.</p>
      </div>
    </div>
  );
}
