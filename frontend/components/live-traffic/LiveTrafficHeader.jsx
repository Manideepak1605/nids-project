export default function LiveTrafficHeader({ lastEventId }) {
    return (
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-3">
                <h1 className="text-3xl md:text-5xl font-bold text-white">
                    Live Traffic <span className="text-violet-400">Hub</span>
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                    <p className="text-gray-400">
                        Real-time network capture and instant threat detection
                    </p>

                    <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/30 font-medium">
                        Live Monitoring
                    </span>
                </div>
            </div>

            <div className="flex flex-col items-end gap-1">
                <div className="text-[10px] text-gray-500 font-mono tracking-tighter opacity-60 uppercase font-bold">
                    Session Hash
                </div>
                <div className="text-xs font-mono text-violet-400 bg-violet-400/5 px-2 py-1 rounded border border-violet-400/20">
                    {lastEventId?.substring(0, 16) || 'LINKING_CORE...'}
                </div>
            </div>
        </div>
    );
}
