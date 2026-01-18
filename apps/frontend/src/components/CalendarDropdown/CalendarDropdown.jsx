import { useMemo, useState } from "react";

export default function CalendarDropdown({
  value,
  onChange,
  locale = "uk-UA",
  classNames,
  onClose,
}) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewDate, setViewDate] = useState(() =>
    value ? startOfMonth(value) : startOfMonth(today)
  );

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    }).format(viewDate);
  }, [viewDate, locale]);

  const selectedDayKey = value ? keyOfDay(value) : null;

  const grid = useMemo(() => buildMonthGrid(viewDate), [viewDate]);

  const isTodayActive = selectedDayKey === keyOfDay(today);

  const goPrev = () => setViewDate((d) => addMonths(d, -1));
  const goNext = () => setViewDate((d) => addMonths(d, 1));

  const pickToday = () => {
    onChange?.(today);
    onClose?.();
  };

  const pickDay = (d) => {
    onChange?.(d);
    onClose?.();
  };

  return (
    <div className={classNames.dropdownCalendar}>
      <button
        type="button"
        className={`${classNames.todayPill} ${
          isTodayActive ? classNames.todayPillActive : ""
        }`}
        onClick={pickToday}
      >
        Від сьогодні
      </button>

      <div className={classNames.calHeader}>
        <div className={classNames.calTitle}>{capitalize(monthLabel)}</div>

        <div className={classNames.calNav}>
          <button type="button" className={classNames.navBtn} onClick={goPrev}>
            ‹
          </button>
          <button type="button" className={classNames.navBtn} onClick={goNext}>
            ›
          </button>
        </div>
      </div>

      <div className={classNames.weekdays}>
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map((d) => (
          <div key={d} className={classNames.weekday}>
            {d}
          </div>
        ))}
      </div>

      <div className={classNames.daysGrid}>
        {grid.map((cell, idx) => {
          if (!cell) return <div key={idx} className={classNames.dayEmpty} />;

          const isSelected = keyOfDay(cell) === selectedDayKey;

          return (
            <button
              key={idx}
              type="button"
              className={`${classNames.dayBtn} ${
                isSelected ? classNames.daySelected : ""
              }`}
              onClick={() => pickDay(cell)}
            >
              {cell.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addMonths(d, n) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return startOfMonth(x);
}

function keyOfDay(d) {
  const x = startOfDay(d);
  return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
}

function buildMonthGrid(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const daysInMonth = last.getDate();

  const jsDay = first.getDay();
  const mondayIndex = (jsDay + 6) % 7;

  const cells = Array(42).fill(null);

  let day = 1;
  for (let i = mondayIndex; i < mondayIndex + daysInMonth; i++) {
    cells[i] = startOfDay(new Date(year, month, day));
    day += 1;
  }

  return cells;
}

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
