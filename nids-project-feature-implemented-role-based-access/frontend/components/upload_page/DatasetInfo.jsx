export default function DatasetInfo() {
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-8">
      <h4 className="text-lg font-semibold text-white mb-4">
        Supported Dataset Format
      </h4>

      <ul className="space-y-3 text-sm text-gray-400">
        <li>• CSV format only</li>
        <li>• Network flow–based features</li>
        <li>• Labeled or unlabeled traffic supported</li>
        <li>• Compatible with NSL-KDD & CICIDS datasets</li>
      </ul>

      <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/10">
        <p className="text-xs text-gray-500">
          Example datasets:
          <br />• NSL-KDD
          <br />• CICIDS 2017
        </p>
      </div>
    </div>
  );
}
