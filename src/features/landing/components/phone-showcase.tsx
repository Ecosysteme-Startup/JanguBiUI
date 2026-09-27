import { Tilt3D } from '@/lib/motion/tilt-3d';

export function PhoneShowcase() {
  return (
    <div className="relative mt-16 flex items-end justify-center gap-6 md:mt-20">
      {/* Halo glow */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-28 w-[500px] -translate-x-1/2 rounded-full bg-primary/20 blur-2xl" />

      {/* Left phone — Liturgie */}
      <div className="relative z-10 hidden w-[185px] animate-float-l overflow-hidden rounded-[32px] border border-primary/14 bg-background opacity-70 shadow-[0_24px_80px_rgba(20,40,80,.16)] dark:shadow-[0_24px_80px_rgba(0,0,0,.6)] lg:block">
        <div className="mx-auto h-4 w-16 rounded-b-xl bg-background" />
        <div className="flex min-h-[360px] flex-col gap-3 bg-background p-3">
          <p className="text-[0.48rem] font-bold uppercase tracking-widest text-primary/80">
            Offices du jour
          </p>
          {[
            ['Laudes', '6h30', '☀️', true],
            ['Messe du jour', '9h00', '✝️', false],
            ['None', '15h00', '🕐', false],
            ['Vêpres', '18h30', '🌙', false],
            ['Complies', '21h00', '⭐', false],
          ].map(([label, time, icon, active]) => (
            <div
              key={label as string}
              className={`flex items-center justify-between rounded-lg border p-2 ${active ? 'border-primary/30 bg-primary/20' : 'border-border bg-foreground/5'}`}
            >
              <div>
                <p
                  className={`text-[0.52rem] font-semibold ${active ? 'text-primary' : 'text-foreground'}`}
                >
                  {label as string}
                </p>
                <p className="text-[0.44rem] text-foreground/35">
                  {time as string}
                </p>
              </div>
              <span className="text-sm">{icon as string}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Center phone — Accueil. Inclinaison 3D au pointeur (≤ 6°, ressort
          doux, souris uniquement) sur l'enveloppe ; le flottement CSS reste sur
          le téléphone lui-même — deux transforms sur deux éléments distincts. */}
      <Tilt3D track="window" className="relative z-10">
        <div className="relative w-[220px] animate-float-c overflow-hidden rounded-[38px] border-[6px] border-primary/14 bg-background shadow-[0_24px_80px_rgba(20,40,80,.18),0_0_48px_rgba(112,203,255,.18)] dark:shadow-[0_24px_80px_rgba(0,0,0,.6),0_0_48px_rgba(112,203,255,.25)]">
          <div className="mx-auto h-4 w-16 rounded-b-xl bg-background" />
          <div className="flex min-h-[380px] flex-col gap-2 bg-background-surface p-3.5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[0.45rem] text-foreground/30">
                  Mercredi 29 avril
                </p>
                <p className="font-serif text-[0.75rem] font-semibold text-primary">
                  Jàngu Bi
                </p>
              </div>
              <span>🔔</span>
            </div>
            <div className="rounded-[13px] border border-primary/25 bg-gradient-to-br from-primary/18 to-primary/6 p-3">
              <p className="mb-1 text-[0.44rem] font-bold uppercase tracking-widest text-primary">
                Liturgie du jour
              </p>
              <p className="mb-1 font-serif text-[0.72rem] font-semibold leading-tight text-foreground">
                3e semaine de Pâques
              </p>
              <p className="text-[0.5rem] italic leading-relaxed text-foreground/50">
                « Je suis le pain de vie. Qui vient à moi n&apos;aura plus
                jamais faim. »
              </p>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[
                ['📖', 'Bible'],
                ['📰', 'Actus'],
                ['💬', 'Prêtre'],
                ['📄', 'Dem. messe'],
                ['💝', 'Dons'],
                ['🪣', 'Quête'],
              ].map(([icon, label]) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-0.5 rounded-[9px] border border-foreground/7 bg-foreground/5 py-1.5 text-center"
                >
                  <span className="text-[0.875rem]">{icon}</span>
                  <span className="text-[0.4rem] leading-tight text-foreground/60">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[0.42rem] font-bold uppercase tracking-widest text-foreground/25">
              Actualités
            </p>
            <div className="flex items-start gap-1.5 rounded-[7px] bg-foreground/4 p-1.5">
              <div className="mt-0.5 size-[5px] shrink-0 rounded-full bg-primary" />
              <p className="text-[0.44rem] leading-snug text-foreground/55">
                Retraite spirituelle — Saint-Joseph, 3 mai 9h
              </p>
            </div>
            <div className="flex items-start gap-1.5 rounded-[7px] bg-foreground/4 p-1.5">
              <div className="mt-0.5 size-[5px] shrink-0 rounded-full bg-accent" />
              <p className="text-[0.44rem] leading-snug text-foreground/55">
                Message du diocèse de Dakar
              </p>
            </div>
          </div>
        </div>
      </Tilt3D>

      {/* Right phone — Chat */}
      <div className="relative z-10 hidden w-[185px] animate-float-r overflow-hidden rounded-[32px] border border-primary/14 bg-background opacity-70 shadow-[0_24px_80px_rgba(20,40,80,.16)] dark:shadow-[0_24px_80px_rgba(0,0,0,.6)] lg:block">
        <div className="mx-auto h-4 w-16 rounded-b-xl bg-background" />
        <div className="flex min-h-[360px] flex-col bg-background-surface">
          <div className="flex items-center gap-2 border-b border-border bg-background p-2.5">
            <div className="flex size-[26px] items-center justify-center rounded-full bg-primary/10 text-xs">
              ✝️
            </div>
            <div>
              <p className="text-[0.58rem] font-semibold text-foreground">
                Père Emmanuel Diallo
              </p>
              <p className="text-[0.44rem] text-foreground/35">En ligne</p>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-1.5 p-2.5">
            {[
              { text: 'Bonjour, comment puis-je vous aider ?', sent: false },
              { text: 'RDV pour 1ère communion svp.', sent: true },
              { text: 'Samedi à 10h ou 15h ?', sent: false },
              { text: '15h parfait, merci ! 🙏', sent: true },
            ].map((msg, i) => (
              <div
                key={i}
                className={`${msg.sent ? 'self-end' : ''} max-w-[82%]`}
              >
                <div
                  className={`rounded-[13px] px-2.5 py-1.5 text-[0.5rem] leading-snug ${msg.sent ? 'rounded-br-[3px] bg-primary font-medium text-primary-foreground' : 'rounded-bl-[3px] bg-foreground/7 text-foreground/75'}`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
