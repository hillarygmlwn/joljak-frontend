// CalendarPanel.js
import React from 'react';

function CalendarPanel({ calendarData }) {
  return (
    <div className="calendar-panel">
      <h3>집중 요약 캘린더</h3>
      <ul>
        {calendarData.map((entry, idx) => (
          <li key={idx}>
            {entry.date}: <strong>{entry.focus_score.toFixed(1)}점</strong>, {
              entry.studyTime
            }분, {entry.place}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CalendarPanel;
