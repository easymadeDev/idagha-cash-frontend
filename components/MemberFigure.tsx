// A member drawn as a person from the chest up: their photo is the face, a tailored suit (or
// blazer) below, and a lanyard the card's name badge hangs from. Used for the phone member cards.
export default function MemberFigure({ id, photo, gender }: { id: string; photo?: string; gender?: string }) {
  const g = (gender || '').toLowerCase();
  const female = g.startsWith('f');
  const male = !female && g.startsWith('m');
  // jacket: light, mid, dark
  const suit = female ? ['#3d74a0', '#2c5a80', '#1f4361'] : male ? ['#5c636b', '#454b52', '#30353a'] : ['#23704a', '#195635', '#103d26'];
  const skin = ['#f6cfae', '#e8b48c', '#cf956d'];
  const hair = female ? ['#f2c66b', '#d9a520'] : ['#45403c', '#262321'];
  const k = (s: string) => `${s}-${id}`;

  return (
    <svg className="mf-figure-svg" viewBox="0 30 200 220" aria-hidden="true">
      <defs>
        <radialGradient id={k('spot')} cx="50%" cy="42%" r="55%">
          <stop offset="0" stopColor={female ? '#9cc7f0' : male ? '#7fb6ef' : '#5fd497'} stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={k('jacket')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={suit[0]} /><stop offset="0.45" stopColor={suit[1]} /><stop offset="1" stopColor={suit[2]} />
        </linearGradient>
        <linearGradient id={k('sheen')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.3" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" /><stop offset="0.75" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={k('neck')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skin[2]} /><stop offset="0.5" stopColor={skin[1]} /><stop offset="1" stopColor={skin[1]} />
        </linearGradient>
        <radialGradient id={k('face')} cx="45%" cy="40%" r="65%">
          <stop offset="0" stopColor={skin[0]} /><stop offset="1" stopColor={skin[1]} />
        </radialGradient>
        <linearGradient id={k('hair')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hair[0]} /><stop offset="1" stopColor={hair[1]} />
        </linearGradient>
        <linearGradient id={k('rim')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff2c2" /><stop offset="0.5" stopColor="#f0c445" /><stop offset="1" stopColor="#b8890f" />
        </linearGradient>
        <clipPath id={k('head')}><circle cx="100" cy="98" r="44" /></clipPath>
      </defs>

      {/* portrait spotlight */}
      <ellipse cx="100" cy="118" rx="96" ry="92" fill={`url(#${k('spot')})`} />

      {/* long hair falls behind the shoulders (drawn faces only) */}
      {!photo && female && <path d="M60 100c0-28 17-46 40-46s40 18 40 46v74H60z" fill={`url(#${k('hair')})`} />}

      {/* neck */}
      <path d="M86 128h28v40c0 6-6 10-14 10s-14-4-14-10z" fill={`url(#${k('neck')})`} />

      {/* jacket: sloping shoulders, soft sheen */}
      <path d="M12 250c0-30 6-50 22-62 14-10 34-16 50-20l16 8 16-8c16 4 36 10 50 20 16 12 22 32 22 62z" fill={`url(#${k('jacket')})`} />
      <path d="M12 250c0-30 6-50 22-62 14-10 34-16 50-20l16 8 16-8c16 4 36 10 50 20 16 12 22 32 22 62z" fill={`url(#${k('sheen')})`} />

      {/* shirt / blouse in the V */}
      <path d="M84 168l16 8 16-8 6 10-22 52-22-52z" fill={female ? '#e88686' : '#fbfbfb'} />
      {female && <path d="M86 172c8 10 20 10 28 0" stroke="#d26d6d" strokeWidth="2.5" fill="none" />}
      {male && (
        <>
          {/* collar points */}
          <path d="M84 168l16 9-9 12zM116 168l-16 9 9 12z" fill="#fff" stroke="#d7d7d7" strokeWidth="1" />
          {/* tie */}
          <path d="M96 178h8l2 6-2 3h-8l-2-3z" fill="#b92c25" />
          <path d="M96 187h8l4 34-8 11-8-11z" fill="#d93a32" />
          <path d="M100 187v44" stroke="#b92c25" strokeWidth="1" opacity="0.6" />
        </>
      )}

      {/* lapels with a crisp edge */}
      <path d="M84 168l-6 10 22 52-10 20H66l6-58z" fill={suit[2]} opacity="0.55" />
      <path d="M116 168l6 10-22 52 10 20h24l-6-58z" fill={suit[2]} opacity="0.55" />
      <path d="M78 178l22 52M122 178l-22 52" stroke="#fff" strokeOpacity="0.18" strokeWidth="1.2" />

      {/* gold pocket square and jacket buttons */}
      <path d="M136 206l14-2 1 7-14 2z" fill="#f0c445" />
      <circle cx="100" cy="238" r="2.6" fill={suit[2]} stroke="#fff" strokeOpacity="0.25" />

      {/* lanyard */}
      <path d="M88 170c2 14 6 28 11 40M112 170c-2 14-6 28-11 40" stroke="#0f5a33" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M88 170c2 14 6 28 11 40M112 170c-2 14-6 28-11 40" stroke="#f0c445" strokeWidth="1.6" strokeLinecap="round" fill="none" />

      {/* head */}
      <circle cx="100" cy="100" r="47" fill="#000" opacity="0.25" />
      {photo ? (
        <image href={photo} x="56" y="54" width="88" height="88" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${k('head')})`} />
      ) : (
        <g clipPath={`url(#${k('head')})`}>
          <rect x="56" y="54" width="88" height="88" fill={female ? '#dcecfb' : male ? '#d6e7f8' : '#d6e8de'} />
          {/* ears */}
          <ellipse cx="72" cy="104" rx="5" ry="8" fill={skin[1]} />
          <ellipse cx="128" cy="104" rx="5" ry="8" fill={skin[1]} />
          <ellipse cx="100" cy="104" rx="27" ry="31" fill={`url(#${k('face')})`} />
          {/* shadow under the hairline */}
          <path d="M74 92c8-6 17-8 26-8s18 2 26 8" stroke="#000" strokeOpacity="0.08" strokeWidth="6" fill="none" />
          {female
            ? <path d="M70 102c0-27 14-40 31-40s30 12 30 34c-12-2-24-9-30-21-6 14-16 24-31 27z" fill={`url(#${k('hair')})`} />
            : male
              ? <path d="M72 100c-2-26 12-40 28-40s30 14 28 40c-3-11-8-17-14-19-12 4-26 4-36-2-3 5-5 11-6 21z" fill={`url(#${k('hair')})`} />
              : <path d="M73 98c0-24 12-36 27-36s27 12 27 36c-8-8-18-12-27-12s-19 4-27 12z" fill="#5b6b62" />}
          {/* soft highlight on the hair */}
          {(female || male) && <path d="M86 70c6-3 14-4 22-1" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" fill="none" />}
        </g>
      )}
      <circle cx="100" cy="98" r="44" fill="none" stroke="#fff" strokeOpacity="0.9" strokeWidth="2.5" />
      <circle cx="100" cy="98" r="47.5" fill="none" stroke={`url(#${k('rim')})`} strokeWidth="2.5" />
    </svg>
  );
}
