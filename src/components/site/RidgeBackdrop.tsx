/**
 * The hero backdrop is drawn, not photographed: layered ridgelines standing in for
 * the NER's terrain, with one national highway threading through them and a convoy
 * moving along it. It is the page's signature — everything else stays quiet.
 */
export function RidgeBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-[min(120vh,900px)] overflow-hidden"
      aria-hidden="true"
    >
      <svg viewBox="0 0 1440 860" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#0A1628" />
            <stop offset="55%" stopColor="#0C1D33" />
            <stop offset="100%" stopColor="#081426" />
          </linearGradient>
          <linearGradient id="ridge1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B3A5C" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0E2038" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="ridge2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16324F" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0B1B2F" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="ridge3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#122A44" />
            <stop offset="100%" stopColor="#0A1728" />
          </linearGradient>
          <linearGradient id="ridge4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0D2038" />
            <stop offset="100%" stopColor="#071120" />
          </linearGradient>
          <radialGradient id="valleyGlow" cx="0.72" cy="0.42" r="0.5">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0A1628" stopOpacity="0" />
            <stop offset="100%" stopColor="#0A1628" stopOpacity="0.96" />
          </linearGradient>
          <path
            id="highway"
            d="M1520 812 C1320 806 1214 742 1156 668 C1096 592 1112 524 1046 476 C978 426 878 442 828 398 C782 358 792 316 762 292"
          />
        </defs>

        <rect width="1440" height="860" fill="url(#sky)" />
        <rect width="1440" height="860" fill="url(#valleyGlow)" />

        {/* Far ridges, hazy */}
        <path
          d="M0 372 C120 330 190 356 268 322 C352 286 404 320 486 300 C568 280 618 236 706 254 C800 274 852 232 942 246 C1046 262 1104 216 1200 236 C1290 254 1352 226 1440 240 L1440 860 L0 860 Z"
          fill="url(#ridge1)"
        />
        <path
          d="M0 452 C96 424 168 452 250 424 C338 394 392 428 470 412 C556 394 610 350 700 372 C792 394 838 356 922 372 C1018 390 1080 348 1176 368 C1266 386 1348 362 1440 376 L1440 860 L0 860 Z"
          fill="url(#ridge2)"
        />
        {/* Mid ridge with a snow-lit crest, the way Sela reads at dusk */}
        <path
          d="M0 546 C104 520 156 552 244 528 C338 502 386 540 468 522 C560 502 604 452 700 476 C790 498 834 462 918 480 C1016 500 1074 458 1170 478 C1262 496 1348 474 1440 486 L1440 860 L0 860 Z"
          fill="url(#ridge3)"
        />
        <path
          d="M604 452 C640 466 664 470 700 476 C736 482 762 470 790 462"
          fill="none"
          stroke="#3E6A96"
          strokeOpacity="0.5"
          strokeWidth="1.5"
        />
        <path
          d="M0 648 C120 622 200 654 300 634 C412 612 470 646 566 630 C670 612 720 574 828 596 C930 616 986 586 1090 604 C1196 622 1330 600 1440 612 L1440 860 L0 860 Z"
          fill="url(#ridge4)"
        />

        {/* The corridor itself */}
        <use href="#highway" stroke="#0F1F35" strokeWidth="26" fill="none" strokeLinecap="round" />
        <use href="#highway" stroke="#1D3B5E" strokeWidth="18" fill="none" strokeLinecap="round" />
        <use
          href="#highway"
          stroke="#22C55E"
          strokeOpacity="0.85"
          strokeWidth="2"
          fill="none"
          strokeDasharray="14 22"
          strokeLinecap="round"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="-360" dur="9s" repeatCount="indefinite" />
        </use>

        {/* A single consignment, moving */}
        <g>
          <circle r="5" fill="#22C55E" />
          <circle r="11" fill="#22C55E" fillOpacity="0.18" />
          <animateMotion dur="16s" repeatCount="indefinite" rotate="auto">
            <mpath href="#highway" />
          </animateMotion>
        </g>

        <rect y="620" width="1440" height="240" fill="url(#fade)" />
      </svg>
    </div>
  );
}
