import { describe, it, expect } from 'vitest';
import {
  getGradeColor,
  formatGrade,
  getGradeLabel,
  calculateAverage,
  formatRut,
  isAttendanceCritical,
  ATTENDANCE_LIMIT_PERCENTAGE,
} from '@/utils/formatters';

describe('getGradeColor', () => {
  it('returns nota-excelente for grades >= 6.0', () => {
    expect(getGradeColor(6.0)).toBe('nota-excelente');
    expect(getGradeColor(7.0)).toBe('nota-excelente');
    expect(getGradeColor(6.5)).toBe('nota-excelente');
  });

  it('returns nota-buena for grades >= 5.0 and < 6.0', () => {
    expect(getGradeColor(5.0)).toBe('nota-buena');
    expect(getGradeColor(5.9)).toBe('nota-buena');
  });

  it('returns nota-regular for grades >= 4.0 and < 5.0', () => {
    expect(getGradeColor(4.0)).toBe('nota-regular');
    expect(getGradeColor(4.9)).toBe('nota-regular');
  });

  it('returns nota-mala for grades < 4.0', () => {
    expect(getGradeColor(3.9)).toBe('nota-mala');
    expect(getGradeColor(1.0)).toBe('nota-mala');
  });
});

describe('formatGrade', () => {
  it('formats grade to one decimal place', () => {
    expect(formatGrade(6)).toBe('6.0');
    expect(formatGrade(5.5)).toBe('5.5');
    expect(formatGrade(4)).toBe('4.0');
  });
});

describe('getGradeLabel', () => {
  it('returns correct labels', () => {
    expect(getGradeLabel(6.0)).toBe('Excelente');
    expect(getGradeLabel(5.0)).toBe('Bueno');
    expect(getGradeLabel(4.0)).toBe('Suficiente');
    expect(getGradeLabel(2.0)).toBe('Insuficiente');
    expect(getGradeLabel(1.0)).toBe('Reprobado');
  });
});

describe('calculateAverage', () => {
  it('returns 0 for empty array', () => {
    expect(calculateAverage([])).toBe(0);
  });

  it('correctly calculates average', () => {
    expect(calculateAverage([4.0, 5.0, 6.0])).toBe(5.0);
    expect(calculateAverage([7.0, 7.0])).toBe(7.0);
    expect(calculateAverage([3.5, 4.5])).toBe(4.0);
  });

  it('rounds to one decimal', () => {
    expect(calculateAverage([4.0, 5.0])).toBe(4.5);
    expect(calculateAverage([4.1, 4.2])).toBe(4.2);
  });
});

describe('formatRut', () => {
  it('formats RUT with dots and dash', () => {
    expect(formatRut('12345678K')).toBe('12.345.678-K');
    expect(formatRut('12345678k')).toBe('12.345.678-K');
    expect(formatRut('9876543-2')).toBe('9.876.543-2');
  });

  it('handles short RUTs', () => {
    expect(formatRut('1')).toBe('1');
  });
});

describe('isAttendanceCritical', () => {
  it(`returns true when absence percentage >= ${ATTENDANCE_LIMIT_PERCENTAGE}%`, () => {
    expect(isAttendanceCritical(15)).toBe(true);
    expect(isAttendanceCritical(20)).toBe(true);
  });

  it(`returns false when absence percentage < ${ATTENDANCE_LIMIT_PERCENTAGE}%`, () => {
    expect(isAttendanceCritical(14)).toBe(false);
    expect(isAttendanceCritical(0)).toBe(false);
  });
});
