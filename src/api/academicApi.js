import { api } from './client.js';

const ACADEMIC_API_BASE_URL = (import.meta.env.VITE_ACADEMIC_API_BASE_URL || "").trim();

function buildAcademicUrl(path) {
  // Normalize inputs
  const trimmedPath = String(path).replace(/^\//, "");

  // Choose which configured base to use (ACADEMIC_API_BASE_URL has priority)
  let baseCandidate = (ACADEMIC_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "").trim();

  if (!baseCandidate) {
    console.error(
      '[academicApi] VITE_ACADEMIC_API_BASE_URL and VITE_API_BASE_URL are both missing. Please set VITE_ACADEMIC_API_BASE_URL or VITE_API_BASE_URL in your .env'
    );
    throw new Error(
      'Academic API base URL is not configured. Set VITE_ACADEMIC_API_BASE_URL (preferred) or VITE_API_BASE_URL in your environment.'
    );
  }

  // Remove trailing slash from base
  const base = baseCandidate.replace(/\/$/, '');

  // If the path already contains the academic prefix (e.g. 'academic/courses')
  // then we simply append the path to the base.
  if (trimmedPath.toLowerCase().startsWith('academic/')) {
    return `${base}/${trimmedPath}`;
  }

  // If base already ends with '/academic', we don't double it.
  if (base.toLowerCase().endsWith('/academic')) {
    return `${base}/${trimmedPath}`;
  }

  // Otherwise prepend the academic prefix so final path becomes '/.../dev/academic/<trimmedPath>'
  return `${base}/academic/${trimmedPath}`;
}

/**
 * Get student enrollments
 * @param {string} studentId - Student ID
 * @returns {Promise} API response with enrollments
 */
export const getStudentEnrollments = async (studentId) => {
  const response = await api.get(buildAcademicUrl('enrollments'), {
    params: { studentId }
  });
  return response.data;
};

/**
 * Get student grades
 * @param {string} studentId - Student ID
 * @returns {Promise} API response with grades
 */
export const getStudentGrades = async (studentId) => {
  const response = await api.get(buildAcademicUrl('grades'), {
    params: { studentId }
  });
  return response.data;
};

/**
 * Get student attendance records
 * @param {string} studentId - Student ID
 * @returns {Promise} API response with attendance records
 */
export const getStudentAttendance = async (studentId) => {
  const response = await api.get(buildAcademicUrl('attendance'), {
    params: { studentId }
  });
  return response.data;
};

/**
 * Get class details
 * @param {string} classId - Class ID
 * @returns {Promise} API response with class details
 */
export const getClassDetails = async (classId) => {
  const response = await api.get(buildAcademicUrl(`classes/${classId}`));
  return response.data;
};

/**
 * Get course details
 * @param {string} courseId - Course ID
 * @returns {Promise} API response with course details
 */
export const getCourseDetails = async (courseId) => {
  const response = await api.get(buildAcademicUrl(`courses/${courseId}`));
  return response.data;
};

// ============================================================
// Courses API
// ============================================================

/**
 * Get all courses
 * @returns {Promise} API response with courses list
 */
export const getCourses = async () => {
  const response = await api.get(buildAcademicUrl('courses'));
  return response.data;
};

/**
 * Create a new course
 * @param {Object} courseData - Course data
 * @returns {Promise} API response
 */
export const createCourse = async (courseData) => {
  const response = await api.post(buildAcademicUrl('courses'), courseData);
  return response.data;
};

/**
 * Update a course
 * @param {string} courseId - Course ID
 * @param {Object} courseData - Updated course data
 * @returns {Promise} API response
 */
export const updateCourse = async (courseId, courseData) => {
  const response = await api.put(buildAcademicUrl(`courses/${courseId}`), courseData);
  return response.data;
};

/**
 * Delete a course
 * @param {string} courseId - Course ID
 * @returns {Promise} API response
 */
export const deleteCourse = async (courseId) => {
  const response = await api.delete(buildAcademicUrl(`courses/${courseId}`));
  return response.data;
};

// ============================================================
// Classes API
// ============================================================

/**
 * Get all classes or filter by courseId
 * @param {string} courseId - Optional course ID to filter classes
 * @returns {Promise} API response with classes list
 */
export const getClasses = async (courseId = null) => {
  const url = buildAcademicUrl('classes');
  const params = courseId ? { courseId } : {};
  const response = await api.get(url, { params });
  return response.data;
};

/**
 * Get a specific class by ID
 * @param {string} classId - Class ID
 * @returns {Promise} API response with class details
 */
export const getClass = async (classId) => {
  const response = await api.get(buildAcademicUrl(`classes/${classId}`));
  return response.data;
};

/**
 * Create a new class
 * @param {Object} classData - Class data
 * @returns {Promise} API response
 */
export const createClass = async (classData) => {
  const response = await api.post(buildAcademicUrl('classes'), classData);
  return response.data;
};

/**
 * Update a class
 * @param {string} classId - Class ID
 * @param {Object} classData - Updated class data
 * @returns {Promise} API response
 */
export const updateClass = async (classId, classData) => {
  const response = await api.put(buildAcademicUrl(`classes/${classId}`), classData);
  return response.data;
};

/**
 * Delete a class
 * @param {string} classId - Class ID
 * @returns {Promise} API response
 */
export const deleteClass = async (classId) => {
  const response = await api.delete(buildAcademicUrl(`classes/${classId}`));
  return response.data;
};

// Get Class Session
export async function getSessionsByClassId(classId) {
  return api.get(`/academic/classes/${classId}/sessions`);
}


// ============================================================
// Enrollments API (Student)
// ============================================================

/**
 * Get my enrollments
 * @param {string} studentId
 */
export const getMyEnrollments = async (studentId) => {
  const response = await api.get(buildAcademicUrl('enrollments'), {
    params: { studentId }
  });
  return response.data;
};

/**
 * Enroll in a class
 */
export const enrollInClass = async (classId, studentId, enrollKey = null) => {
  const body = { classId, studentId };
  if (enrollKey) body.enrollKey = enrollKey;

  const response = await api.post(buildAcademicUrl('enrollments'), body);
  return response.data;
};

/**
 * Unenroll from class (DELETE with no JSON body fix)
 */
export const unenrollFromClass = async (enrollmentId) => {
  const url = buildAcademicUrl(`enrollments/${enrollmentId}`);

  try {
    const response = await api.delete(url);

    // Backend có thể trả 204 → không JSON
    if (!response.data) return { success: true };

    return response.data;
  } catch (e) {
    throw new Error(e?.response?.data?.message || "Unenroll failed");
  }
};
// ============================================================
// Teacher API
// ============================================================

export const getTeacher = async (teacherId) => {
  const response = await api.get(buildAcademicUrl(`teachers/${teacherId}`));
  return response.data;
};

// ============================================================
// Materials API
// ============================================================

export const getClassMaterials = async (courseId, classId) => {
  const url = buildAcademicUrl(`courses/${courseId}/classes/${classId}/materials`);
  const response = await api.get(url);
  return response.data;
};

export const getMaterialDownloadUrl = async (materialId) => {
  const response = await api.get(buildAcademicUrl(`materials/${materialId}/download-url`));
  return response.data;
};
