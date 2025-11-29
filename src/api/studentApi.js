import { api } from './client.js';

const STUDENT_API_BASE_URL = (import.meta.env.VITE_ACADEMIC_API_BASE_URL || "").trim();

function buildStudentUrl(path) {
  // path: e.g. 'students' or 'students/123' or '/students/123'
  const trimmedPath = String(path).replace(/^\//, "");

  if (!STUDENT_API_BASE_URL) {
    // No specific student API base configured — attempt to use VITE_API_BASE_URL
    const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim();
    if (!API_BASE_URL) {
      console.error(
        '[studentApi] VITE_ACADEMIC_API_BASE_URL and VITE_API_BASE_URL are both missing. Please set VITE_ACADEMIC_API_BASE_URL or VITE_API_BASE_URL in your .env'
      );
      throw new Error(
        'Student API base URL is not configured. Set VITE_ACADEMIC_API_BASE_URL (preferred) or VITE_API_BASE_URL in your environment.'
      );
    }

    console.warn('[studentApi] VITE_ACADEMIC_API_BASE_URL is not set — building absolute URL using VITE_API_BASE_URL');
    // Make sure there's exactly one slash between base and path
    const base = API_BASE_URL.replace(/\/$/, '');
    return `${base}/academic/${trimmedPath}`;
  }

  // If configured as a full URL or a path fragment, normalize and combine
  const base = STUDENT_API_BASE_URL.replace(/\/$/, '');
  return `${base}/academic/${trimmedPath}`;
}

/**
 * Get list of all students with optional filters
 * @param {Object} params - Query parameters (name, phone, email, status)
 * @returns {Promise} API response with student list
 */
export const getStudents = async (params = {}) => {
  const response = await api.get(buildStudentUrl('students'), {
    params,
  });
  return response.data;
};

/**
 * Get detailed information about a specific student
 * @param {string} studentId - Student ID
 * @returns {Promise} API response with student details
 */
export const getStudent = async (studentId) => {
  const response = await api.get(buildStudentUrl(`students/${studentId}`));
  return response.data;
};

/**
 * Search students by criteria
 * @param {Object} searchCriteria - Search parameters
 * @returns {Promise} API response with search results
 */
export const searchStudents = async (searchCriteria) => {
  const response = await api.post(buildStudentUrl('students/search'), searchCriteria);
  return response.data;
};

/**
 * Create a new student
 * @param {Object} studentData - Student data
 * @returns {Promise} API response with created student
 */
export const createStudent = async (studentData) => {
  const response = await api.post(buildStudentUrl('students'), studentData);
  return response.data;
};

/**
 * Update student information
 * @param {string} studentId - Student ID
 * @param {Object} studentData - Updated student data
 * @returns {Promise} API response with updated student
 */
export const updateStudent = async (studentId, studentData) => {
  const response = await api.put(buildStudentUrl(`students/${studentId}`), studentData);
  return response.data;
};

/**
 * Delete a student
 * @param {string} studentId - Student ID
 * @returns {Promise} API response
 */
export const deleteStudent = async (studentId) => {
  const response = await api.delete(buildStudentUrl(`students/${studentId}`));
  return response.data;
};

/**
 * Update student status
 * @param {string} studentId - Student ID
 * @param {Object} statusData - Status update data
 * @returns {Promise} API response
 */
export const updateStudentStatus = async (studentId, statusData) => {
  const response = await api.put(buildStudentUrl(`students/${studentId}/status`), statusData);
  return response.data;
};

/**
 * Get student status history
 * @param {string} studentId - Student ID
 * @returns {Promise} API response with status history
 */
export const getStatusHistory = async (studentId) => {
  const response = await api.get(buildStudentUrl(`students/${studentId}/status/history`));
  return response.data;
};

/**
 * Add note to student record
 * @param {string} studentId - Student ID
 * @param {Object} noteData - Note data
 * @returns {Promise} API response
 */
export const addNote = async (studentId, noteData) => {
  const response = await api.post(buildStudentUrl(`students/${studentId}/notes`), noteData);
  return response.data;
};

/**
 * Get student notes
 * @param {string} studentId - Student ID
 * @returns {Promise} API response with notes
 */
export const getNotes = async (studentId) => {
  const response = await api.get(buildStudentUrl(`students/${studentId}/notes`));
  return response.data;
};

/**
 * Get student dashboard (aggregated data: student info + academic info)
 * Uses the BFF aggregator pattern to fetch all data in one API call
 * @param {string} studentId - Student ID
 * @returns {Promise} API response with { studentInfo, academicInfo }
 */
export const getStudentDashboard = async (studentId) => {
  const response = await api.get(buildStudentUrl(`dashboard/${studentId}`));
  return response.data;
};
