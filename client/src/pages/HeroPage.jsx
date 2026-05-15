import { useEffect, useRef } from 'react';
import { translations } from '../i18n/translations';

export default function HeroPage({ lang, setLang, onStart }) {
  const t = translations[lang];
  const videoRef = useRef(null);

  // Smooth fade loop logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animId;
    const FADE_DURATION = 0.5;

    const loop = () => {
      if (!video.duration) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const time = video.currentTime;
      const duration = video.duration;

      if (time < FADE_DURATION) {
        video.style.opacity = time / FADE_DURATION;
      } else if (time > duration - FADE_DURATION) {
        video.style.opacity = (duration - time) / FADE_DURATION;
      } else {
        video.style.opacity = 1;
      }

      animId = requestAnimationFrame(loop);
    };

    const handleEnded = () => {
      video.style.opacity = 0;
      setTimeout(() => {
        video.currentTime = 0;
        video.play();
      }, 100);
    };

    video.addEventListener('ended', handleEnded);
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* Video Background */}
      <div className="absolute" style={{ top: '300px', inset: 'auto 0 0 0' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ opacity: 0 }}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4"
          muted
          playsInline
          autoPlay
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
      </div>

      {/* Navigation — Clean: Logo + Lang + CTA only */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        {/* Logo */}
        <img src="/LOGO.png" alt="CarbonIQ" className="h-10" />

        {/* Right side: Language + CTA */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
            className="text-sm text-muted hover:text-black transition-colors px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-400"
          >
            {lang === 'tr' ? 'EN' : 'TR'}
          </button>

          <button
            onClick={onStart}
            className="rounded-full px-6 py-2.5 text-sm text-white hover:scale-[1.03] transition-transform"
            style={{ background: '#588157' }}
          >
            {t.nav.cta}
          </button>
        </div>
      </nav>

      {/* Hero Content */}
      <section
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 pb-40"
        style={{ paddingTop: 'calc(8rem - 75px)' }}
      >
        <h2
          className="font-serif text-5xl sm:text-7xl md:text-8xl max-w-7xl font-normal animate-fade-rise"
          style={{ lineHeight: 0.95, letterSpacing: '-2.46px' }}
        >
          <span className="text-black">{t.hero.headline_1} </span>
          <em className="text-muted">{t.hero.headline_2}</em>
          <br />
          <em className="text-muted">{t.hero.headline_3}</em>
        </h2>

        <p className="text-base sm:text-lg max-w-2xl mt-8 leading-relaxed text-muted animate-fade-rise-delay">
          {t.hero.description}
        </p>

        <button
          onClick={onStart}
          className="rounded-full px-14 py-5 text-base text-white mt-12 hover:scale-[1.03] transition-transform animate-fade-rise-delay-2"
            style={{ background: '#588157' }}
        >
          {t.hero.cta}
        </button>
      </section>
    </div>
  );
}
