// A member drawn as a person from the chest up: their photo is the face, a suit (or blazer)
// below, and a lanyard that the card's name badge hangs from. Used for the phone member cards.
export default function MemberFigure({ id, photo, gender }: { id: string; photo?: string; gender?: string }) {
  const g = (gender || '').toLowerCase();
  const female = g.startsWith('f');
  const male = !female && g.startsWith('m');
  const suit = female ? ['#2f5d82', '#244a69'] : male ? ['#4b5157', '#383d42'] : ['#1d5a3a', '#14432b'];
  const clip = `mfig-${id}`;
  const shade = `mfig-s-${id}`;
  return (
    <svg className="mf-figure-svg" viewBox="0 46 200 204" aria-hidden="true">
      <defs>
        <clipPath id={clip}><circle cx="100" cy="74" r="50" /></clipPath>
        <linearGradient id={shade} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={suit[0]} /><stop offset="1" stopColor={suit[1]} />
        </linearGradient>
      </defs>

      {/* long hair falls behind the shoulders when there's no photo */}
      {!photo && female && <path d="M58 106c0-30 18-48 42-48s42 18 42 48v66H58z" fill="#e9b949" />}

      {/* neck: short, the head sits on the shoulders */}
      <rect x="87" y="136" width="26" height="36" rx="9" fill="#e8b48c" />
      <path d="M87 150c7 7 19 7 26 0v12H87z" fill="#000" opacity="0.14" />

      {/* shoulders and jacket */}
      <path d="M10 250c0-58 34-86 90-88 56 2 90 30 90 88z" fill={`url(#${shade})`} />
      {/* shirt or blouse in the V */}
      <path d="M76 163l24 56 24-56c-8 6-16 9-24 9s-16-3-24-9z" fill={female ? '#e57373' : '#ffffff'} />
      {male && (
        <>
          <path d="M76 163l12 22 12-13z M124 163l-12 22-12-13z" fill="#ffffff" stroke="#d9d9d9" strokeWidth="1" />
          <path d="M96 175h8l3 34-7 10-7-10z" fill="#d93a32" />
          <rect x="95" y="171" width="10" height="7" rx="2" fill="#b72f28" />
        </>
      )}
      {/* lapels */}
      <path d="M76 163l24 56-12 31H60l8-62z" fill="#000" opacity="0.18" />
      <path d="M124 163l-24 56 12 31h28l-8-62z" fill="#000" opacity="0.18" />
      {/* lanyard for the name badge */}
      <path d="M84 166l14 46M116 166l-14 46" stroke="#f0c445" strokeWidth="3" strokeLinecap="round" />

      {/* head, lowered onto the neck (the clip circle moves with it) */}
      <g transform="translate(4 32) scale(0.96)">
      {photo ? (
        <image href={photo} x="50" y="24" width="100" height="100" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clip})`} />
      ) : (
        <g clipPath={`url(#${clip})`}>
          <rect x="50" y="24" width="100" height="100" fill={female ? '#d4e8fb' : male ? '#cfe3f7' : '#cfe0d6'} />
          <ellipse cx="100" cy="82" rx="30" ry="35" fill="#f4c7a1" />
          {female
            ? <path d="M68 82c0-29 15-44 33-44s31 13 31 36c-13-2-26-10-32-23-6 15-17 26-32 31z" fill="#e9b949" />
            : male
              ? <path d="M69 80c-2-28 13-44 31-44s33 15 31 44c-4-12-9-18-15-20-13 4-28 4-39-2-4 6-7 12-8 22z" fill="#3a3a3a" />
              : <path d="M70 78c0-26 14-40 30-40s30 14 30 40c-9-9-20-13-30-13s-21 4-30 13z" fill="#5b6b62" />}
        </g>
      )}
      <circle cx="100" cy="74" r="50" fill="none" stroke="#ffffff" strokeWidth="3" />
      <circle cx="100" cy="74" r="53" fill="none" stroke="#f0c445" strokeWidth="2" opacity="0.9" />
      </g>
    </svg>
  );
}
