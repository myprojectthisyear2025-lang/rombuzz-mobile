/**
 * ============================================================================
 * 📁 File: app/auth/register-full/steps/Step1Basic.tsx
 * 🎯 Step 1 — Basic Info
 *
 * PURPOSE:
 *   - Collects the core user info:
 *       firstName, lastName, password, confirm password,
 *       gender, date of birth, lookingFor, interestedIn.
 *   - This matches Step 1 in web `Register.jsx`.
 *
 * PROPS:
 *   - form        → current RegisterForm state
 *   - setField    → (key, value) updater from parent
 *   - dobInvalid  → boolean flag for invalid DOB / under 18
 *   - canNext     → boolean; controls "Next" enabled/disabled
 *   - onNext      → callback to go to Step 2
 * ============================================================================
 */

import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { ScrollView } from "react-native";
import { GENDERS, LOOKING_FOR, RegisterForm } from "../index";

// Month names for header
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type Props = {
  form: RegisterForm;
  setField: (key: keyof RegisterForm, value: any) => void;
  dobInvalid: boolean;
  canNext: boolean;
  onNext: () => void;
};

export default function Step1Basic({
  form,
  setField,
  dobInvalid,
  canNext,
  onNext,
}: Props) {
  // --- Date formatting helpers ---
  const formatMMDDYYYY = (date: Date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  };

  const isoFromYMD = (year: number, monthIndex: number, day: number) => {
    const d = new Date(year, monthIndex, day);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  };

  const initialDobDate = useMemo(() => {
    if (form.dob) {
      const d = new Date(form.dob);
      if (!Number.isNaN(d.getTime())) return d;
    }
    // Default DOB calendar start: Jan 1, 2000
    return new Date(2000, 0, 1);
  }, [form.dob]);

  // --- Local DOB display state ---
  const [localDob, setLocalDob] = useState(
    form.dob ? formatMMDDYYYY(initialDobDate) : ""
  );

  // --- Calendar state (pure JS calendar, no native module) ---
  const [dobCalendarOpen, setDobCalendarOpen] = useState(false);
  const [showYearWheel, setShowYearWheel] = useState(false);
  const [calendarYear, setCalendarYear] = useState(initialDobDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(initialDobDate.getMonth()); // 0-11

  // Dropdown visibility states
  const [showGender, setShowGender] = useState(false);
  const [showLooking, setShowLooking] = useState(false);
  const [showInterestedDrop, setShowInterestedDrop] = useState(false);

  // Password visibility states
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Build calendar matrix for current month/year
  const calendarWeeks = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const firstWeekday = firstDay.getDay(); // 0=Sun..6=Sat
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const weeks: (number | null)[][] = [];
    let current = 1 - firstWeekday;

    while (current <= daysInMonth) {
      const week: (number | null)[] = [];
      for (let i = 0; i < 7; i++) {
        if (current < 1 || current > daysInMonth) {
          week.push(null);
        } else {
          week.push(current);
        }
        current++;
      }
      weeks.push(week);
    }

    return weeks;
  }, [calendarYear, calendarMonth]);

  // When tapping DOB field, open calendar pre-positioned at current DOB (or default)
  const openDobCalendar = () => {
    const base = form.dob ? new Date(form.dob) : initialDobDate;
    setCalendarYear(base.getFullYear());
    setCalendarMonth(base.getMonth());
    setDobCalendarOpen(true);
  };

  const selectDobDay = (day: number) => {
    const iso = isoFromYMD(calendarYear, calendarMonth, day);
    const d = new Date(iso);
    const shown = formatMMDDYYYY(d);

    setLocalDob(shown);
    setField("dob", iso);
    setDobCalendarOpen(false);
  };

  const goPrevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 0) {
        setCalendarYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const goNextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 11) {
        setCalendarYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // Toggle interestedIn selection
  const toggleInterested = (key: string) => {
    const set = new Set(form.interestedIn);
    set.has(key) ? set.delete(key) : set.add(key);
    setField("interestedIn", Array.from(set));
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        // Close dropdowns when tapping outside
        setShowGender(false);
        setShowLooking(false);
        setShowInterestedDrop(false);
        // Keep DOB calendar controlled by its own backdrop
      }}
    >
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Basic info</Text>

        {/* First / Last Name */}
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="First name"
            placeholderTextColor="#999"
            value={form.firstName}
            onChangeText={(v) => setField("firstName", v)}
          />
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="Last name"
            placeholderTextColor="#999"
            value={form.lastName}
            onChangeText={(v) => setField("lastName", v)}
          />
        </View>

        {/* Password with eye toggle */}
        <View style={styles.inputWithIcon}>
          <TextInput
            style={styles.inputFlex}
            placeholder="Password (min 6 characters)"
            placeholderTextColor="#999"
            secureTextEntry={!showPass}
            value={form.password}
            onChangeText={(v) => setField("password", v)}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Text style={styles.eye}>{showPass ? "👁" : "👁‍🗨"}</Text>
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputWithIcon}>
          <TextInput
            style={styles.inputFlex}
            placeholder="Confirm password"
            placeholderTextColor="#999"
            secureTextEntry={!showConfirmPass}
            value={form.confirm}
            onChangeText={(v) => setField("confirm", v)}
          />
          <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)}>
            <Text style={styles.eye}>{showConfirmPass ? "👁" : "👁‍🗨"}</Text>
          </TouchableOpacity>
        </View>

        {/* Gender + DOB row */}
        <View style={styles.row}>
          {/* Gender dropdown */}
          <View style={[styles.col, styles.half]}>
            <Text style={styles.label}>Gender</Text>

            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowGender((prev) => !prev)}
            >
              <Text style={styles.dropdownText}>
                {form.gender || "Select Gender"}
              </Text>
              <Text>▾</Text>
            </TouchableOpacity>

            {showGender && (
              <View style={styles.dropdownList}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setField("gender", g);
                      setShowGender(false);
                    }}
                  >
                    <Text>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* DOB calendar trigger */}
          <View style={[styles.col, styles.half]}>
            <Text style={styles.label}>Date of birth</Text>

            <TouchableOpacity
              onPress={openDobCalendar}
              style={[
                styles.inputSmall,
                dobInvalid && styles.inputInvalid,
                { justifyContent: "center" },
              ]}
            >
              <Text style={{ color: localDob ? "#000" : "#aaa" }}>
                {localDob || "MM-DD-YYYY"}
              </Text>
            </TouchableOpacity>
               {/* 18+ note directly under picker */}
            <Text style={styles.dobNote}>Must be 18 years</Text>

            {dobInvalid && (
              <Text style={styles.error}>
                Please enter a valid date (18+ only).
              </Text>
            )}
          </View>
        </View>

        {/* What are you looking for? dropdown */}
        <View style={styles.block}>
          <Text style={styles.label}>What are you looking for?</Text>

          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowLooking((prev) => !prev)}
          >
            <Text style={styles.dropdownText}>
              {form.lookingFor
                ? LOOKING_FOR.find((x) => x.key === form.lookingFor)?.label
                : "Select one"}
            </Text>
            <Text>▾</Text>
          </TouchableOpacity>

          {showLooking && (
            <View style={styles.dropdownList}>
              {LOOKING_FOR.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setField("lookingFor", opt.key);
                    setShowLooking(false);
                  }}
                >
                  <Text>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Interested In chips */}
        <View style={styles.block}>
          <Text style={styles.label}>Interested in</Text>
          <View style={styles.chipRow}>
            {["male", "female", "other"].map((key) => {
              const active = form.interestedIn.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleInterested(key)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.chipTextActive,
                    ]}
                  >
                    {key[0].toUpperCase() + key.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Next button */}
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              !canNext && styles.nextButtonDisabled,
            ]}
            disabled={!canNext}
            onPress={onNext}
          >
            <Text style={styles.nextText}>Next →</Text>
          </TouchableOpacity>
        </View>

        {/* DOB Calendar Overlay */}
        {dobCalendarOpen && (
          <View style={styles.calendarOverlay}>
            {/* Backdrop */}
            <TouchableOpacity
              style={styles.calendarBackdrop}
              activeOpacity={1}
              onPress={() => setDobCalendarOpen(false)}
            />

            {/* Calendar card */}
            <View style={styles.calendarCard}>
            {/* HEADER WITH CLICKABLE YEAR */}
<View style={styles.calendarHeader}>
  <TouchableOpacity onPress={goPrevMonth}>
    <Text style={styles.calendarNavArrow}>‹</Text>
  </TouchableOpacity>

  {/* MONTH + YEAR */}
  <TouchableOpacity
    onPress={() => setShowYearWheel((prev) => !prev)}
    style={{ flexDirection: "row", alignItems: "center" }}
  >
    <Text style={styles.calendarMonthLabel}>
      {MONTH_NAMES[calendarMonth]}
    </Text>
    <Text style={[styles.calendarMonthLabel, { marginLeft: 6 }]}>
      {calendarYear} ▾
    </Text>
  </TouchableOpacity>

  <TouchableOpacity onPress={goNextMonth}>
    <Text style={styles.calendarNavArrow}>›</Text>
  </TouchableOpacity>
</View>

{/* YEAR WHEEL — NEW */}
{showYearWheel && (
  <View style={styles.yearWheelBox}>
    <ScrollView
      style={{ maxHeight: 180 }}
      contentContainerStyle={{ paddingVertical: 6 }}
      showsVerticalScrollIndicator={true}
    >
      {Array.from(
        { length: 100 },
        (_, i) => new Date().getFullYear() - 18 - i
      ).map((year) => (
        <TouchableOpacity
          key={year}
          style={[
            styles.yearItem,
            year === calendarYear && styles.yearItemSelected,
          ]}
          onPress={() => {
            setCalendarYear(year);
            setShowYearWheel(false);
          }}
        >
          <Text
            style={[
              styles.yearText,
              year === calendarYear && styles.yearTextSelected,
            ]}
          >
            {year}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
)}


              {/* Weekday labels */}
              <View style={styles.calendarWeekRow}>
            {["S", "M", "T", "W", "T", "F", "S"].map((label, idx) => (
                <Text
                  key={`${label}-${idx}`}
                  style={[styles.calendarDayText, styles.calendarWeekday]}
                >
                  {label}
                </Text>
              ))}

              </View>

              {/* Calendar days */}
              {calendarWeeks.map((week, index) => (
                <View key={index} style={styles.calendarWeekRow}>
                  {week.map((day, idx) => {
                    if (!day) {
                      return (
                        <View
                          key={idx}
                          style={[styles.calendarDayCell, styles.calendarDayEmpty]}
                        />
                      );
                    }

                    const iso = isoFromYMD(calendarYear, calendarMonth, day);
                    const isSelected = form.dob === iso;

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.calendarDayCell,
                          isSelected && styles.calendarDaySelected,
                        ]}
                        onPress={() => selectDobDay(day)}
                      >
                        <Text
                          style={[
                            styles.calendarDayText,
                            isSelected && styles.calendarDayTextSelected,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

// =============================
// 🎨 Styles
// =============================
const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    position: "relative", // needed for calendar overlay
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  col: {
    flexDirection: "column",
  },
  half: {
    flex: 1,
  },
  input: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 15,
    marginBottom: 8,
  },
  inputSmall: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    fontSize: 14,
    marginTop: 4,
  },
  inputInvalid: {
    borderWidth: 1,
    borderColor: "#ff3366",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
  },
  block: {
    marginTop: 6,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  chipActive: {
    backgroundColor: "#ff2f6e",
    borderColor: "#ff2f6e",
  },
  chipText: {
    fontSize: 12,
    color: "#444",
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  error: {
    fontSize: 11,
    color: "#ff3366",
    marginTop: 2,
  },
   dobNote: {
    fontSize: 11,
    color: "#777",
    marginTop: 2,
  },
  footerRow: {
    marginTop: 12,
    alignItems: "flex-end",
  },
  nextButton: {
    backgroundColor: "#ff2f6e",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  nextButtonDisabled: {
    backgroundColor: "#ccc",
  },
  nextText: {
    color: "#fff",
    fontWeight: "700",
  },

  // Dropdown styles
  dropdownButton: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  dropdownText: {
    color: "#444",
    fontSize: 14,
  },
  dropdownList: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 6,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  // Password input + eye icon
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  inputFlex: {
    flex: 1,
    fontSize: 15,
  },
  eye: {
    fontSize: 18,
    marginLeft: 8,
  },

  // Calendar overlay
  calendarOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  calendarBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  calendarCard: {
    width: "90%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 6,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  calendarMonthLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  calendarNavArrow: {
    fontSize: 22,
    paddingHorizontal: 6,
    color: "#ff2f6e",
  },
  calendarWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  calendarDayCell: {
    width: 32,
    height: 32,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarDayEmpty: {
    backgroundColor: "transparent",
  },
  calendarDaySelected: {
    backgroundColor: "#ff2f6e",
  },
  calendarDayText: {
    fontSize: 13,
    color: "#333",
  },
  calendarDayTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },

  calendarWeekday: {
    fontWeight: "600",
    fontSize: 12,
    color: "#999",
  },
  yearWheelBox: {
  width: "100%",
  maxHeight: 160,
  borderWidth: 1,
  borderColor: "#eee",
  borderRadius: 12,
  marginBottom: 10,
  overflow: "hidden",
},

yearWheel: {
  maxHeight: 160,
},

yearItem: {
  paddingVertical: 8,
  alignItems: "center",
},

yearItemSelected: {
  backgroundColor: "#ffeff5",
},

yearText: {
  fontSize: 15,
  color: "#444",
},

yearTextSelected: {
  fontSize: 15,
  fontWeight: "700",
  color: "#ff2f6e",
},

});
