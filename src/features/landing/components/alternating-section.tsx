import { Check } from 'lucide-react';

import { Reveal } from '@/lib/motion/reveal';

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[0.9375rem] text-foreground/60">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
        <Check className="size-3" />
      </span>
      {children}
    </li>
  );
}

function NewsMockup() {
  return (
    <div className="overflow-hidden rounded-[20px] border border-border shadow-[0_24px_64px_rgba(20,40,80,.14)] dark:shadow-[0_24px_64px_rgba(0,0,0,.4)]">
      <div className="bg-background-surface p-5">
        <h3 className="mb-4 border-b border-border pb-3 font-serif text-[0.9375rem] font-semibold text-foreground">
          Actualités paroissiales
        </h3>
        {[
          {
            dot: 'bg-primary',
            scope: 'Global',
            scopeColor: 'text-primary',
            title: 'Message du Pape François pour le Jubilé 2025',
            meta: 'Il y a 2 heures',
          },
          {
            dot: 'bg-accent',
            scope: 'Diocèse de Dakar',
            scopeColor: 'text-accent',
            title: 'Rencontre des jeunes catholiques — Édition 2026',
            meta: 'Hier',
          },
          {
            dot: 'bg-success',
            scope: 'Paroisse Saint-Joseph',
            scopeColor: 'text-success',
            title: 'Retraite de carême — inscription ouverte',
            meta: '3 mai · 9h00',
          },
          {
            dot: 'bg-primary',
            scope: 'Global',
            scopeColor: 'text-primary',
            title: 'Dimanche de la Divine Miséricorde — homélie',
            meta: 'Il y a 3 jours',
          },
        ].map(({ dot, scope, scopeColor, title, meta }) => (
          <div
            key={title}
            className="flex gap-3 border-b border-border py-3.5 last:border-0"
          >
            <div className={`mt-1 size-[7px] shrink-0 rounded-full ${dot}`} />
            <div>
              <p
                className={`mb-1 text-[0.5625rem] font-bold uppercase tracking-wider ${scopeColor}`}
              >
                {scope}
              </p>
              <p className="mb-1 text-[0.8125rem] font-semibold leading-snug text-foreground">
                {title}
              </p>
              <p className="text-[0.625rem] text-foreground/40">{meta}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatMockup() {
  return (
    <div className="overflow-hidden rounded-[20px] border border-border shadow-[0_24px_64px_rgba(20,40,80,.14)] dark:shadow-[0_24px_64px_rgba(0,0,0,.4)]">
      <div className="flex flex-col bg-background-surface">
        <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3.5">
          <div className="flex size-[34px] shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-lg">
            ✝️
          </div>
          <div>
            <p className="text-[0.75rem] font-semibold text-foreground">
              Père Emmanuel Diallo
            </p>
            <p className="text-[0.5625rem] text-foreground/40">
              En ligne · Paroisse Saint-Joseph
            </p>
          </div>
        </div>
        <div className="flex min-h-[220px] flex-col gap-2 p-4">
          {[
            {
              text: 'Bonjour Marie-Claire, comment puis-je vous aider ?',
              sent: false,
              time: '9:42',
            },
            {
              text: "Père, j'aurais besoin d'un RDV pour la 1ère communion.",
              sent: true,
              time: '9:45 ✓✓',
            },
            {
              text: 'Bien sûr ! Samedi 10h ou 15h ?',
              sent: false,
              time: '9:47',
            },
            { text: '15h parfait, merci Père 🙏', sent: true, time: '9:48 ✓✓' },
          ].map((msg, i) => (
            <div
              key={i}
              className={`${msg.sent ? 'self-end' : ''} max-w-[82%]`}
            >
              <div
                className={`rounded-2xl px-3 py-2 text-[0.6875rem] leading-snug ${
                  msg.sent
                    ? 'rounded-br-[4px] bg-primary font-medium text-primary-foreground'
                    : 'rounded-bl-[4px] bg-foreground/7 text-foreground/80'
                }`}
              >
                {msg.text}
              </div>
              <p
                className={`mt-0.5 text-[0.5rem] text-foreground/40 ${msg.sent ? 'text-right text-primary/60' : ''}`}
              >
                {msg.time}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocsMockup() {
  return (
    <div className="overflow-hidden rounded-[20px] border border-border shadow-[0_24px_64px_rgba(20,40,80,.14)] dark:shadow-[0_24px_64px_rgba(0,0,0,.4)]">
      <div className="bg-background-surface p-5">
        <h3 className="mb-4 border-b border-border pb-3 font-serif text-[0.9375rem] font-semibold text-foreground">
          Mes contributions &amp; demandes
        </h3>
        {[
          {
            icon: '💝',
            type: 'Don — Rénovation chapelle',
            sub: 'Paroisse Saint-Joseph · 25 000 FCFA',
            badge: 'Reçu',
            badgeClass: 'bg-success/15 text-success border border-success/30',
          },
          {
            icon: '🪣',
            type: 'Quête dominicale',
            sub: 'Dimanche 28 avril · 5 000 FCFA',
            badge: 'Envoyée',
            badgeClass: 'bg-success/15 text-success border border-success/30',
          },
          {
            icon: '📄',
            type: 'Demande de baptême',
            sub: 'Demandé le 20 avril',
            badge: 'En cours',
            badgeClass: 'bg-primary/10 text-primary border border-primary/25',
          },
          {
            icon: '📋',
            type: 'Certificat de mariage',
            sub: 'Demandé le 15 avril',
            badge: 'À compléter',
            badgeClass: 'bg-accent/10 text-accent border border-accent/25',
          },
        ].map(({ icon, type, sub, badge, badgeClass }) => (
          <div
            key={type}
            className="flex items-center justify-between border-b border-border py-3 last:border-0"
          >
            <div>
              <p className="text-[0.75rem] font-semibold text-foreground">
                {icon} {type}
              </p>
              <p className="mt-0.5 text-[0.5625rem] text-foreground/40">
                {sub}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[0.5rem] font-bold uppercase tracking-wide ${badgeClass}`}
            >
              {badge}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AlternatingSection() {
  return (
    <section id="alternating" className="py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-10">
        {/* Actualités */}
        <div className="mb-24 grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <NewsMockup />
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mb-3 text-[0.6875rem] font-bold uppercase tracking-[.12em] text-primary">
              Actualités paroissiales
            </p>
            <h2 className="mb-4 font-serif text-4xl font-bold leading-tight tracking-tight text-foreground">
              Votre paroisse,
              <br />
              en temps réel.
            </h2>
            <p className="mb-6 text-[1.0625rem] leading-[1.72] text-foreground/60">
              Global, diocésain, paroissial — tout en un fil clair, organisé,
              accessible.
            </p>
            <ul className="flex flex-col gap-2.5">
              <CheckItem>Catégories par thème</CheckItem>
              <CheckItem>Portées global / diocèse / paroisse</CheckItem>
              <CheckItem>Partage en un tap</CheckItem>
            </ul>
          </Reveal>
        </div>

        {/* Chat prêtres */}
        <div className="mb-24 grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal delay={0.08} className="order-2 lg:order-1">
            <p className="mb-3 text-[0.6875rem] font-bold uppercase tracking-[.12em] text-primary">
              Discussion confidentielle
            </p>
            <h2 className="mb-4 font-serif text-4xl font-bold leading-tight tracking-tight text-foreground">
              Parlez à votre
              <br />
              prêtre en privé.
            </h2>
            <p className="mb-6 text-[1.0625rem] leading-[1.72] text-foreground/60">
              Échanges sécurisés et chiffrés avec les prêtres de votre
              communauté.
            </p>
            <ul className="flex flex-col gap-2.5">
              <CheckItem>Messages chiffrés de bout en bout</CheckItem>
              <CheckItem>Purge automatique (180 jours)</CheckItem>
              <CheckItem>Réactions &amp; export</CheckItem>
            </ul>
          </Reveal>
          <Reveal className="order-1 lg:order-2">
            <ChatMockup />
          </Reveal>
        </div>

        {/* Dons & Documents */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <DocsMockup />
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mb-3 text-[0.6875rem] font-bold uppercase tracking-[.12em] text-primary">
              Dons, Quête &amp; Documents
            </p>
            <h2 className="mb-4 font-serif text-4xl font-bold leading-tight tracking-tight text-foreground">
              Contribuez et gérez
              <br />
              vos sacrements.
            </h2>
            <p className="mb-6 text-[1.0625rem] leading-[1.72] text-foreground/60">
              Quête en ligne, dons paroissiaux et demandes de documents
              ecclésiastiques — tout depuis l&apos;app.
            </p>
            <ul className="flex flex-col gap-2.5">
              <CheckItem>Paiement mobile (Orange Money, Wave…)</CheckItem>
              <CheckItem>Suivi en temps réel de vos demandes</CheckItem>
              <CheckItem>Notifications à chaque étape</CheckItem>
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
