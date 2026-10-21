// Mock fallback data for local development when Django backend is not running
export function getMockResponse(url, method = "GET") {
  const path = url.split("?")[0];

  if (path.endsWith("/dashboard/summary/")) {
    return {
      totalStudents: { count: 52, trend: { value: 14, direction: "up" } },
      horses: { count: 28, trend: { value: 8, direction: "up" } },
      revenue: { paidAmount: 245000, pendingAmount: 38000, trend: { value: 18, direction: "up" } },
      courses: { count: 8, trend: { value: 2, direction: "up" } },
    };
  }

  if (path.endsWith("/dashboard/revenue-trend/")) {
    return [
      { label: "2026-05", revenue: 140000 },
      { label: "2026-06", revenue: 165000 },
      { label: "2026-07", revenue: 190000 },
      { label: "2026-08", revenue: 175000 },
      { label: "2026-09", revenue: 215000 },
      { label: "2026-10", revenue: 245000 },
    ];
  }

  if (path.endsWith("/dashboard/latest-horses/")) {
    return {
      count: 4,
      results: [
        { id: 1, name: "Royal Sovereign", breed: "Andalusian", age: 7, gender: "Stallion", status: "Active" },
        { id: 2, name: "Desert Star", breed: "Arabian", age: 5, gender: "Mare", status: "Active" },
        { id: 3, name: "Shadow King", breed: "Thoroughbred", age: 6, gender: "Gelding", status: "Training" },
        { id: 4, name: "Golden Majesty", breed: "Warmblood", age: 8, gender: "Stallion", status: "Active" },
      ],
    };
  }

  if (path.endsWith("/dashboard/latest-students/")) {
    return {
      count: 4,
      results: [
        { id: 1, name: "Hamza Malik", admission_date: "2026-02-14", experience_level: "Advanced", is_active: true },
        { id: 2, name: "Zoya Farooq", admission_date: "2026-03-01", experience_level: "Intermediate", is_active: true },
        { id: 3, name: "Ali Ahmed Khan", admission_date: "2026-04-10", experience_level: "Beginner", is_active: true },
        { id: 4, name: "Fatima Noor", admission_date: "2026-05-18", experience_level: "Intermediate", is_active: true },
      ],
    };
  }

  if (path.includes("/students/")) {
    return {
      count: 6,
      total_pages: 1,
      results: [
        { id: 1, name: "Hamza Malik", age: 19, phone_number: "+92 300 1234567", cnic: "34101-1234567-1", experience_level: "Advanced", guardian_name: "Tariq Malik", guardian_contact: "+92 300 9876543", admission_date: "2026-02-14", is_active: true },
        { id: 2, name: "Zoya Farooq", age: 16, phone_number: "+92 301 2345678", cnic: "34101-2345678-2", experience_level: "Intermediate", guardian_name: "Farooq Azam", guardian_contact: "+92 301 8765432", admission_date: "2026-03-01", is_active: true },
        { id: 3, name: "Ali Ahmed Khan", age: 14, phone_number: "+92 302 3456789", cnic: "34101-3456789-3", experience_level: "Beginner", guardian_name: "Ahmed Khan", guardian_contact: "+92 302 7654321", admission_date: "2026-04-10", is_active: true },
        { id: 4, name: "Fatima Noor", age: 21, phone_number: "+92 303 4567890", cnic: "34101-4567890-4", experience_level: "Intermediate", guardian_name: "Noor Alam", guardian_contact: "+92 303 6543210", admission_date: "2026-05-18", is_active: true },
        { id: 5, name: "Bilal Hassan", age: 18, phone_number: "+92 304 5678901", cnic: "34101-5678901-5", experience_level: "Beginner", guardian_name: "Hassan Raza", guardian_contact: "+92 304 5432109", admission_date: "2026-06-22", is_active: true },
        { id: 6, name: "Ayesha Tariq", age: 15, phone_number: "+92 305 6789012", cnic: "34101-6789012-6", experience_level: "Advanced", guardian_name: "Tariq Mehmood", guardian_contact: "+92 305 4321098", admission_date: "2026-07-05", is_active: false },
      ],
    };
  }

  if (path.includes("/horses/")) {
    return {
      count: 4,
      total_pages: 1,
      results: [
        { id: 1, name: "Royal Sovereign", breed: "Andalusian", age: 7, gender: "Stallion", color: "Dapple Gray", height: "16.2 hh", status: "Active", owner_name: "Syed Abu Ali", microchip_id: "MC-98214" },
        { id: 2, name: "Desert Star", breed: "Arabian", age: 5, gender: "Mare", color: "Chestnut", height: "15.1 hh", status: "Active", owner_name: "Malik Jahangir", microchip_id: "MC-87421" },
        { id: 3, name: "Shadow King", breed: "Thoroughbred", age: 6, gender: "Gelding", color: "Midnight Black", height: "16.0 hh", status: "Training", owner_name: "Chaudhry Waqas", microchip_id: "MC-65123" },
        { id: 4, name: "Golden Majesty", breed: "Warmblood", age: 8, gender: "Stallion", color: "Palomino Gold", height: "17.0 hh", status: "Active", owner_name: "School Owned", microchip_id: "MC-44901" },
      ],
    };
  }

  if (path.includes("/courses/")) {
    return {
      count: 4,
      total_pages: 1,
      results: [
        { id: 1, name: "Foundational Equestrian Riding", duration_weeks: 8, fee: 35000, level: "Beginner", max_students: 12, enrolled_count: 9, is_active: true, instructor: "Captain Rashid" },
        { id: 2, name: "Intermediate Show Jumping", duration_weeks: 12, fee: 55000, level: "Intermediate", max_students: 8, enrolled_count: 7, is_active: true, instructor: "Zafar Iqbal" },
        { id: 3, name: "Classical Dressage Mastery", duration_weeks: 16, fee: 75000, level: "Advanced", max_students: 6, enrolled_count: 5, is_active: true, instructor: "Major Saleem" },
        { id: 4, name: "Polo Sprint & Control", duration_weeks: 10, fee: 65000, level: "Advanced", max_students: 10, enrolled_count: 8, is_active: true, instructor: "Malik Usman" },
      ],
    };
  }

  if (path.includes("/horse-owners/")) {
    return {
      count: 3,
      total_pages: 1,
      results: [
        { id: 1, name: "Syed Abu Ali", phone_number: "+92 313 3313131", cnic: "34101-1111111-1", address: "City Villas, Sialkot", horses_count: 6 },
        { id: 2, name: "Malik Jahangir", phone_number: "+92 310 8025673", cnic: "34101-2222222-2", address: "Cantt Road, Sialkot", horses_count: 3 },
        { id: 3, name: "Chaudhry Waqas", phone_number: "+92 321 4455667", cnic: "34101-3333333-3", address: "Model Town, Lahore", horses_count: 4 },
      ],
    };
  }

  if (path.includes("/fees/") || path.includes("/billing/")) {
    return {
      count: 5,
      total_pages: 1,
      results: [
        { id: 1, receipt_no: "REC-2026-001", student_name: "Hamza Malik", fee_type: "Monthly Course Fee", amount: 35000, payment_method: "Bank Transfer", status: "Paid", date: "2026-10-15", month: "October", year: "2026" },
        { id: 2, receipt_no: "REC-2026-002", student_name: "Zoya Farooq", fee_type: "Show Jumping Course", amount: 55000, payment_method: "Cash", status: "Paid", date: "2026-10-18", month: "October", year: "2026" },
        { id: 3, receipt_no: "REC-2026-003", student_name: "Ali Ahmed Khan", fee_type: "Registration Fee", amount: 15000, payment_method: "Card", status: "Paid", date: "2026-10-19", month: "October", year: "2026" },
        { id: 4, receipt_no: "REC-2026-004", student_name: "Fatima Noor", fee_type: "Monthly Course Fee", amount: 45000, payment_method: "Bank Transfer", status: "Pending", date: "2026-10-20", month: "October", year: "2026" },
        { id: 5, receipt_no: "REC-2026-005", student_name: "Bilal Hassan", fee_type: "Stabling Fee", amount: 28000, payment_method: "Cash", status: "Paid", date: "2026-10-21", month: "October", year: "2026" },
      ],
    };
  }

  if (path.includes("/workers/")) {
    return {
      count: 4,
      total_pages: 1,
      results: [
        { id: 1, name: "Captain Rashid", role: "Head Riding Instructor", phone_number: "+92 300 5551234", salary: 85000, join_date: "2024-01-10", is_active: true },
        { id: 2, name: "Zafar Iqbal", role: "Senior Groom & Stables Lead", phone_number: "+92 301 5552345", salary: 50000, join_date: "2024-03-15", is_active: true },
        { id: 3, name: "Dr. Asim Faraz", role: "Veterinary Specialist", phone_number: "+92 302 5553456", salary: 110000, join_date: "2023-11-01", is_active: true },
        { id: 4, name: "Mukhtar Ahmad", role: "Farrier & Equipment Handler", phone_number: "+92 303 5554567", salary: 45000, join_date: "2025-02-20", is_active: true },
      ],
    };
  }

  if (path.includes("/attendance/")) {
    return {
      count: 4,
      results: [
        { id: 1, student_name: "Hamza Malik", date: "2026-10-21", status: "Present", course_name: "Classical Dressage", horse_name: "Royal Sovereign" },
        { id: 2, student_name: "Zoya Farooq", date: "2026-10-21", status: "Present", course_name: "Show Jumping", horse_name: "Desert Star" },
        { id: 3, student_name: "Ali Ahmed Khan", date: "2026-10-21", status: "Late", course_name: "Foundational Riding", horse_name: "Golden Majesty" },
        { id: 4, student_name: "Fatima Noor", date: "2026-10-21", status: "Excused", course_name: "Intermediate Riding", horse_name: "Shadow King" },
      ],
    };
  }

  // Generic fallback
  return { results: [], count: 0, detail: "OK" };
}
