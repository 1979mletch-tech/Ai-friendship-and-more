export function AuroraFigure() {
  const portrait = `${import.meta.env.BASE_URL}aurora-portrait.webp`

  return (
    <svg className="aurora-figure" viewBox="0 0 220 430" role="img" aria-label="Animated full-body illustration of Aurora">
      <defs>
        <clipPath id="auroraFaceClip">
          <ellipse cx="110" cy="72" rx="51" ry="58" />
        </clipPath>
        <linearGradient id="auroraTop" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#766a9b" />
          <stop offset="1" stopColor="#3b3657" />
        </linearGradient>
        <linearGradient id="auroraLeggings" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#353047" />
          <stop offset="1" stopColor="#211e30" />
        </linearGradient>
        <linearGradient id="auroraSkin" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#f2d6c6" />
          <stop offset="1" stopColor="#c99f91" />
        </linearGradient>
        <filter id="auroraSoftShadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity="0.25" />
        </filter>
      </defs>

      <ellipse className="aurora-ground-shadow" cx="110" cy="414" rx="60" ry="10" fill="rgba(0,0,0,.24)" />

      <g className="aurora-rig" filter="url(#auroraSoftShadow)">
        <g className="aurora-rig-leg aurora-rig-leg-left">
          <rect x="76" y="252" width="28" height="106" rx="14" fill="url(#auroraLeggings)" />
          <rect x="76" y="346" width="25" height="59" rx="12" fill="url(#auroraLeggings)" />
          <path d="M70 397 Q91 392 105 403 Q103 416 72 415 Q65 409 70 397Z" fill="#171621" />
        </g>
        <g className="aurora-rig-leg aurora-rig-leg-right">
          <rect x="116" y="252" width="28" height="106" rx="14" fill="url(#auroraLeggings)" />
          <rect x="119" y="346" width="25" height="59" rx="12" fill="url(#auroraLeggings)" />
          <path d="M115 403 Q130 392 151 397 Q156 409 149 415 Q118 416 115 403Z" fill="#171621" />
        </g>

        <path className="aurora-rig-hips" d="M70 228 Q110 211 150 228 L145 278 Q110 290 75 278Z" fill="#2e2a3e" />
        <path className="aurora-rig-torso" d="M68 132 Q110 112 152 132 Q157 182 149 235 Q110 251 71 235 Q63 183 68 132Z" fill="url(#auroraTop)" />
        <path d="M82 137 Q110 153 138 137" fill="none" stroke="rgba(255,255,255,.13)" strokeWidth="4" strokeLinecap="round" />
        <rect className="aurora-neck" x="96" y="105" width="28" height="35" rx="14" fill="url(#auroraSkin)" />

        <g className="aurora-rig-arm aurora-rig-arm-left">
          <rect x="45" y="137" width="25" height="90" rx="13" fill="url(#auroraTop)" />
          <rect x="42" y="214" width="22" height="71" rx="11" fill="url(#auroraSkin)" />
          <ellipse cx="52" cy="288" rx="12" ry="16" fill="url(#auroraSkin)" />
        </g>
        <g className="aurora-rig-arm aurora-rig-arm-right">
          <rect x="150" y="137" width="25" height="90" rx="13" fill="url(#auroraTop)" />
          <rect x="156" y="214" width="22" height="71" rx="11" fill="url(#auroraSkin)" />
          <ellipse cx="168" cy="288" rx="12" ry="16" fill="url(#auroraSkin)" />
        </g>

        <g className="aurora-rig-head">
          <ellipse className="aurora-face-warmth" cx="110" cy="79" rx="47" ry="51" fill="rgba(255,190,178,.08)" />
          <ellipse cx="110" cy="73" rx="58" ry="65" fill="#231f31" />
          <image href={portrait} x="56" y="13" width="108" height="124" preserveAspectRatio="xMidYMid slice" clipPath="url(#auroraFaceClip)" />
          <path className="aurora-hair-left" d="M58 73 Q50 132 76 146 Q67 107 74 79Z" fill="#211d2c" opacity=".92" />
          <path className="aurora-hair-right" d="M162 73 Q170 132 144 146 Q153 107 146 79Z" fill="#211d2c" opacity=".92" />
          <g className="aurora-eye-detail" aria-hidden="true"><circle className="aurora-pupil aurora-pupil-left" cx="91" cy="73" r="1.8" fill="#30242b" /><circle className="aurora-pupil aurora-pupil-right" cx="129" cy="73" r="1.8" fill="#30242b" /></g>
          <path className="aurora-rig-blink" d="M82 73 Q91 77 100 73 M120 73 Q129 77 138 73" fill="none" stroke="#3a2930" strokeWidth="3" strokeLinecap="round" />
          <ellipse className="aurora-cheek aurora-cheek-left" cx="83" cy="91" rx="9" ry="5" fill="rgba(216,113,126,.12)" />
          <ellipse className="aurora-cheek aurora-cheek-right" cx="137" cy="91" rx="9" ry="5" fill="rgba(216,113,126,.12)" />
          <ellipse className="aurora-rig-mouth" cx="110" cy="99" rx="9" ry="2.4" fill="#8e5567" />
        </g>
      </g>
    </svg>
  )
}
