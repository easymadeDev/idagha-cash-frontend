// A member drawn as a person from the chest up: their photo is the face, a tailored suit (or
// blazer) below with a gold school pin, fading into the page. Used for the phone member cards.
export default function MemberFigure({ id, photo, gender }: { id: string; photo?: string; gender?: string }) {
  const g = (gender || '').toLowerCase();
  const female = g.startsWith('f');
  const male = !female && g.startsWith('m');
  // jacket: light, mid, dark
  const suit = female ? ['#4a82b0', '#2f5f88', '#1d4262'] : male ? ['#646b73', '#474d54', '#2e3237'] : ['#2a7d53', '#1b5c3a', '#103d26'];
  const skin = ['#f7d3b4', '#e9b68e', '#c98d66'];
  const hair = female ? ['#f4cd72', '#c9951c'] : ['#4a4440', '#211e1c'];
  const k = (s: string) => `${s}-${id}`;

  return (
    <svg className="mf-figure-svg" viewBox="0 44 200 206" aria-hidden="true">
      <defs>
        <radialGradient id={k('spot')} cx="50%" cy="40%" r="55%">
          <stop offset="0" stopColor={female ? '#a6cdf2' : male ? '#86baf0' : '#62d69a'} stopOpacity="0.5" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={k('jacket')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={suit[0]} /><stop offset="0.5" stopColor={suit[1]} /><stop offset="1" stopColor={suit[2]} />
        </linearGradient>
        <linearGradient id={k('sheen')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.28" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" /><stop offset="0.78" stopColor="#fff" stopOpacity="0.07" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={k('neck')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skin[2]} /><stop offset="0.6" stopColor={skin[1]} />
        </linearGradient>
        <radialGradient id={k('face')} cx="45%" cy="38%" r="70%">
          <stop offset="0" stopColor={skin[0]} /><stop offset="1" stopColor={skin[1]} />
        </radialGradient>
        <linearGradient id={k('hair')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hair[0]} /><stop offset="1" stopColor={hair[1]} />
        </linearGradient>
        <linearGradient id={k('rim')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff4c9" /><stop offset="0.5" stopColor="#f0c445" /><stop offset="1" stopColor="#a87c0c" />
        </linearGradient>
        {/* the bust dissolves into the page at the bottom */}
        <linearGradient id={k('fadeG')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.72" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={k('fade')} maskUnits="userSpaceOnUse" x="0" y="44" width="200" height="206">
          <rect x="0" y="44" width="200" height="206" fill={`url(#${k('fadeG')})`} />
        </mask>
        <clipPath id={k('head')}><circle cx="100" cy="104" r="45" /></clipPath>
      </defs>

      {/* portrait spotlight */}
      <ellipse cx="100" cy="128" rx="96" ry="88" fill={`url(#${k('spot')})`} />

      <g mask={`url(#${k('fade')})`}>
        {/* long hair falling over the shoulders (drawn faces only) */}
        {!photo && female && (
          <path d="M57 108c0-34 19-52 43-52s43 18 43 52l3 56c-6 10-17 13-25 8H79c-8 5-19 2-25-8z" fill={`url(#${k('hair')})`} />
        )}

        {/* neck: short and broad, mostly under the head */}
        <path d="M83 132h34v34c0 7-8 12-17 12s-17-5-17-12z" fill={`url(#${k('neck')})`} />

        {/* jacket with sloping shoulders and a soft sheen */}
        <path id={k('body')} d="M8 250c0-34 8-56 26-68 15-10 34-15 49-18l17 9 17-9c15 3 34 8 49 18 18 12 26 34 26 68z" fill={`url(#${k('jacket')})`} />
        <path d="M8 250c0-34 8-56 26-68 15-10 34-15 49-18l17 9 17-9c15 3 34 8 49 18 18 12 26 34 26 68z" fill={`url(#${k('sheen')})`} />
        {/* arm seams */}
        <path d="M40 186c-6 18-8 40-8 64M160 186c6 18 8 40 8 64" stroke="#000" strokeOpacity="0.16" strokeWidth="2" fill="none" />

        {/* shirt / blouse */}
        <path d="M83 164l17 9 17-9 7 11-24 56-24-56z" fill={female ? '#ee9a9a' : '#fbfbfb'} />
        {female && <path d="M85 170c9 11 21 11 30 0" stroke="#d97878" strokeWidth="2.5" fill="none" />}
        {male && (
          <>
            <path d="M83 164l17 10-9 13zM117 164l-17 10 9 13z" fill="#fff" stroke="#d9d9d9" strokeWidth="1" />
            <path d="M96 175h8l2 6-2 3h-8l-2-3z" fill="#a8261f" />
            <path d="M96 184h8l4 36-8 11-8-11z" fill="#d6372f" />
            <path d="M97 190l7 6M96 200l9 8M95 211l10 8" stroke="#a8261f" strokeWidth="1.4" opacity="0.7" />
          </>
        )}

        {/* lapels */}
        <path d="M83 164l-7 11 24 56-11 19H64l7-62z" fill={suit[2]} opacity="0.6" />
        <path d="M117 164l7 11-24 56 11 19h25l-7-62z" fill={suit[2]} opacity="0.6" />
        <path d="M76 175l24 56M124 175l-24 56" stroke="#fff" strokeOpacity="0.2" strokeWidth="1.2" />

        {/* gold school pin on the lapel, pocket square, button */}
        <circle cx="78" cy="196" r="4.2" fill={`url(#${k('rim')})`} stroke="#7a5a08" strokeWidth="0.8" />
        <path d="M78 193.2l0.9 1.9 2 0.3-1.5 1.4 0.4 2-1.8-1-1.8 1 0.4-2-1.5-1.4 2-0.3z" fill="#0f5a33" />
        <path d="M134 204l15-3 1.5 7-15 3z" fill="#f0c445" />
        <circle cx="100" cy="240" r="2.6" fill={suit[2]} stroke="#fff" strokeOpacity="0.3" />
      </g>

      {/* head */}
      <circle cx="100" cy="107" r="47" fill="#000" opacity="0.28" />
      {photo ? (
        <image href={photo} x="55" y="59" width="90" height="90" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${k('head')})`} />
      ) : (
        <g clipPath={`url(#${k('head')})`}>
          <rect x="55" y="59" width="90" height="90" fill={female ? '#e2effc' : male ? '#dbeaf9' : '#dbece2'} />
          <ellipse cx="72" cy="110" rx="5" ry="8" fill={skin[1]} />
          <ellipse cx="128" cy="110" rx="5" ry="8" fill={skin[1]} />
          <ellipse cx="100" cy="110" rx="27" ry="31" fill={`url(#${k('face')})`} />
          {/* a friendly face */}
          <path d="M86 101q4-3 8 0M106 101q4-3 8 0" stroke="#5a3d2b" strokeWidth="2" strokeLinecap="round" fill="none" />
          <ellipse cx="90" cy="108" rx="2.6" ry="3.2" fill="#3b2a20" />
          <ellipse cx="110" cy="108" rx="2.6" ry="3.2" fill="#3b2a20" />
          <circle cx="90.8" cy="107" r="0.9" fill="#fff" />
          <circle cx="110.8" cy="107" r="0.9" fill="#fff" />
          <ellipse cx="84" cy="117" rx="5" ry="3" fill="#f08a8a" opacity="0.3" />
          <ellipse cx="116" cy="117" rx="5" ry="3" fill="#f08a8a" opacity="0.3" />
          <path d="M93 121q7 6 14 0" stroke="#b5604a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          {female
            ? <path d="M70 108c0-28 14-42 31-42s30 13 30 36c-12-2-24-10-30-22-6 15-16 25-31 28z" fill={`url(#${k('hair')})`} />
            : male
              ? <path d="M72 106c-2-27 12-41 28-41s30 14 28 41c-3-12-8-18-14-20-12 4-26 4-36-2-3 5-5 12-6 22z" fill={`url(#${k('hair')})`} />
              : <path d="M73 104c0-25 12-37 27-37s27 12 27 37c-8-8-18-12-27-12s-19 4-27 12z" fill="#5b6b62" />}
          {(female || male) && <path d="M86 74c6-3 14-4 22-1" stroke="#fff" strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" fill="none" />}
        </g>
      )}
      <circle cx="100" cy="104" r="45" fill="none" stroke="#fff" strokeOpacity="0.92" strokeWidth="2.5" />
      <circle cx="100" cy="104" r="48.5" fill="none" stroke={`url(#${k('rim')})`} strokeWidth="2.6" />
    </svg>
  );
}
