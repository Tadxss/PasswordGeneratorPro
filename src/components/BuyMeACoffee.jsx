export default function BuyMeACoffee() {
    return (
        <div className="mt-4 flex items-center justify-center gap-3 py-4 text-slate-500 text-sm">
            <span>Found this useful? Support the work —</span>
            <a
                href="https://coff.ee/daryltadss8"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-slate-400 hover:text-orange-400 transition-colors font-medium"
            >
                <span>☕</span>
                <span>Buy me a coffee</span>
            </a>
        </div>
    )
}
