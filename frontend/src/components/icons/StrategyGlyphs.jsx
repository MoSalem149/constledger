export function StraightLineGlyph({ className, selected }) {
  return (
    <svg
      className={className}
      viewBox="0 0 277 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M2.28906 80H273.566" stroke="#EBEBEB" />

      <path
        opacity="0.7"
        d="M2.5625 79.5379L273.507 8.46094V79.5379H2.5625Z"
        fill="#EBEBEB"
      />
      {selected && (
        <path
          opacity="0.7"
          d="M2.5625 79.5379L273.507 8.46094V79.5379H2.5625Z"
          fill="#FF4800"
        />
      )}
      <path
        d="M2.5625 79.5379L273.507 8.46094"
        stroke="#242424"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SCurveGlyph({ className, selected }) {
  return (
    <svg
      className={className}
      viewBox="0 0 271 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M3.73828 86.6738H265.393" stroke="#EBEBEB" />

      <path
        opacity="0.7"
        d="M3.73828 86.6723L29.9038 84.9562L56.0693 81.3746L82.2348 74.4914L108.4 62.9446L134.566 47.4992L160.731 32.0539L186.897 20.5071L213.062 13.6239L239.228 10.0423L265.393 8.32617V86.6723H3.73828Z"
        fill="#EBEBEB"
      />
      {selected && (
        <path
          opacity="0.7"
          d="M3.73828 86.6723L29.9038 84.9562L56.0693 81.3746L82.2348 74.4914L108.4 62.9446L134.566 47.4992L160.731 32.0539L186.897 20.5071L213.062 13.6239L239.228 10.0423L265.393 8.32617V86.6723H3.73828Z"
          fill="#FF4800"
        />
      )}
      <path
        d="M3.73828 86.6723L29.9038 84.9562L56.0693 81.3746L82.2348 74.4914L108.4 62.9446L134.566 47.4992L160.731 32.0539L186.897 20.5071L213.062 13.6239L239.228 10.0423L265.393 8.32617"
        stroke="#242424"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MilestoneGlyph({ className, selected }) {
  return (
    <svg
      className={className}
      viewBox="0 0 271 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M5.28906 85.9883H265.152" stroke="#EBEBEB" />

      {/* default light fill under the milestone shape */}
      <path
        opacity="0.7"
        d="M5.28906 85.9887V78.1541L57.2617 70.3195L109.234 46.8157L161.207 38.981L213.179 15.4772L265.152 7.64258V85.9887H5.28906Z"
        fill="#EBEBEB"
      />
      {selected && (
        <path
          opacity="0.7"
          d="M5.28906 85.9887V78.1541L57.2617 70.3195L109.234 46.8157L161.207 38.981L213.179 15.4772L265.152 7.64258V85.9887H5.28906Z"
          fill="#FF4800"
        />
      )}
      <path
        d="M5.28906 85.9887V78.1541L57.2617 70.3195L109.234 46.8157L161.207 38.981L213.179 15.4772L265.152 7.64258"
        stroke="#242424"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
