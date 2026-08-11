export function HowToPlayModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div className={open ? '' : 'hidden'}>
      <button
        type="button"
        aria-label="Close how to play"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-[#0d2fa0] text-white ring-1 ring-white/15">
          <div className="flex items-start justify-between gap-3 border-b border-white/10 p-6 pb-4">
            <div>
              <h2 className="text-xl font-bold">🎮 How to Play</h2>
              <p className="mt-1 text-sm text-white/60">Three fun ways to win a TindaCoupon!</p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>

          <div className="scrollbar-none flex flex-col gap-3 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="flex items-center gap-2 font-semibold">❓ Quiz Bowl</p>
              <p className="mt-1.5 text-sm text-white/70">
                Answer fun trivia about our merchants — get enough right and you win! No time
                limit, so take your time and get to know the tindahans. 😊
              </p>
            </div>

            <div className="rounded-xl bg-white/5 p-4">
              <p className="flex items-center gap-2 font-semibold">✅ You are taSKed</p>
              <p className="mt-1.5 text-sm text-white/70">
                Complete 3 easy tasks: invite 3 friends, share your favorite GUADAHIUSA moment on
                Facebook, and leave a message for the youth. Finish all 3 to win! 🎉
              </p>
            </div>

            <div className="rounded-xl bg-white/5 p-4">
              <p className="flex items-center gap-2 font-semibold">🗳️ Voting</p>
              <p className="mt-1.5 text-sm text-white/70">
                Watch for a live voting round announced on stage (e.g. a 10-minute People's
                Choice) and vote for your favorite performer in every category while it's running.
                TindaCoupons drop randomly sometime during that round — not everyone wins, but
                everyone who voted has a shot. 🤞
              </p>
            </div>

            <div className="rounded-xl bg-amber-400/10 p-4 ring-1 ring-amber-400/30">
              <p className="flex items-center gap-2 font-semibold text-amber-200">🎟️ Your Prize</p>
              <p className="mt-1.5 text-sm text-white/70">
                Win Quiz Bowl or taSKed and get a random TindaCoupon instantly — present it to
                that tindahan to claim your reward! Voting coupons drop at random during the live
                round instead.
              </p>
              <p className="mt-2 text-xs text-white/50">
                ⚠️ Tickets are given out randomly per tindahan, while supplies last — finish the game fast!
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 p-6 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full bg-white px-6 py-2.5 text-sm font-medium text-[#113DCB] hover:bg-white/90"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
