import { Layout } from '../../components/layout/Layout'

const REGISTRATION_FORM_URL = 'https://forms.gle/LbBVhMK8he3sDimu5'

const TINDA_ZONES = [
  { zone: 'Zone A', category: 'Food', icon: '🍔' },
  { zone: 'Zone B', category: 'Beverages', icon: '🥤' },
  { zone: 'Zone C', category: 'Arts & Crafts', icon: '🎨' },
  { zone: 'Zone D', category: 'Apparel', icon: '👕' },
]

function RegisterButton({ className = '' }: { className?: string }) {
  return (
    <a
      href={REGISTRATION_FORM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#113DCB] transition hover:bg-white/90 ${className}`}
    >
      Register Now
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 0 1 0-1.06L10.94 10 7.21 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z"
          clipRule="evenodd"
        />
      </svg>
    </a>
  )
}

function GuidelineSection({
  title,
  items,
  tone = 'default',
}: {
  title: string
  items: string[]
  tone?: 'default' | 'prohibited'
}) {
  const dotClass = tone === 'prohibited' ? 'bg-red-400' : 'bg-emerald-400'
  return (
    <section className="rounded-2xl bg-white/5 p-6">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-white/70 md:text-base">
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function BeATindahanPage() {
  return (
    <Layout>
      <div className="flex w-full max-w-4xl flex-col gap-10 px-4 py-10">
        <div>
          <p className="mb-2 text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
            Join TindAdventure
          </p>
          <h1 className="text-2xl font-semibold text-white md:text-3xl">TindAdventure 2026</h1>
          <p className="mt-2 text-sm italic text-white/60 md:text-base">
            "Empowering Young Entrepreneurs, One Booth at a Time"
          </p>
          <RegisterButton className="mt-5" />
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-amber-400/25 via-white/10 to-transparent p-6 ring-1 ring-amber-300/40 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-amber-300 uppercase">
            🎟️ The TindaCoupon Advantage
          </p>
          <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
            ₱3,000 worth of subsidy for your products or services
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/70 md:text-base">
            Every merchant receives ₱3,000 worth of subsidy in exchange for their products or
            services — that's what we call a TindaCoupon. It's a chance to promote what you sell
            while walking away with guaranteed income from the event.
          </p>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-white">Background</h2>
          <p className="text-sm leading-relaxed text-white/70 md:text-base">
            TindAdventure is an entrepreneurship initiative under the Linggo ng Kabataan
            Celebration that aims to provide young entrepreneurs within the barangay with a free
            platform to showcase, promote, and sell their products and services.
          </p>
          <p className="mt-1 text-sm font-medium text-white/80">📅 Date: August 21–22</p>
        </section>

        <GuidelineSection
          title="Eligibility"
          items={[
            'Be a resident of Barangay Guadalupe.',
            'Be between 15–30 years old.',
            'Own, co-own, or manage a legitimate small business, startup, home-based business, or creative enterprise.',
            'Register before the announced deadline.',
          ]}
        />

        <GuidelineSection
          title="Booth Allocation"
          items={[
            'Booth spaces are FREE of charge.',
            'Booth assignments shall be made by the organizing committee.',
            'Participants may not transfer or exchange assigned spaces without approval.',
            'Participants are encouraged to decorate their booths while maintaining safety and cleanliness.',
          ]}
        />

        <section className="flex flex-col gap-3 rounded-2xl bg-white/5 p-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Tinda Zones</h2>
            <p className="mt-1 text-sm text-white/60">
              Booths are grouped by category — your zone is assigned by the organizing committee
              based on what you sell.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TINDA_ZONES.map(({ zone, category, icon }) => (
              <div
                key={zone}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-white/5 px-3 py-4 text-center ring-1 ring-white/10"
              >
                <span className="text-2xl">{icon}</span>
                <p className="text-xs font-medium tracking-widest text-amber-300 uppercase">{zone}</p>
                <p className="text-sm font-semibold text-white">{category}</p>
              </div>
            ))}
          </div>
        </section>

        <GuidelineSection
          title="Merchant Responsibilities"
          items={[
            'Bring their own display materials, extension cords, chairs, decorations, and cash/change.',
            'Keep their assigned booth clean and organized.',
            'Display prices clearly.',
            'Conduct business honestly and professionally.',
            'Follow instructions from organizers.',
          ]}
        />

        <GuidelineSection
          tone="prohibited"
          title="Prohibited Activities"
          items={[
            'Selling illegal or prohibited products.',
            'Selling alcoholic beverages, cigarettes, vape products, or any age-restricted items.',
            'Gambling activities.',
            'Blocking walkways or emergency exits.',
            'Damaging public property.',
            'Subletting booth spaces.',
            'Violations may result in immediate removal from the event.',
          ]}
        />

        <GuidelineSection
          title="Waste Management"
          items={[
            'Segregate waste properly.',
            'Maintain cleanliness around their booth.',
            'Dispose of garbage only in designated bins.',
            'Leave the booth area clean after the event.',
          ]}
        />

        <section className="flex flex-col items-start gap-3 rounded-3xl bg-linear-to-br from-amber-400/25 via-white/10 to-transparent p-6 ring-1 ring-amber-300/40 sm:items-center sm:text-center sm:p-8">
          <h2 className="text-xl font-bold text-white sm:text-2xl">Ready to join?</h2>
          <p className="text-sm text-white/70 md:text-base">
            Register now to secure your free booth and TindaCoupon subsidy.
          </p>
          <RegisterButton />
        </section>
      </div>
    </Layout>
  )
}
