import { getSession, refreshTokens, isTokenExpired } from './auth';

const API_BASE_URL = import.meta.env.VITE_ACADEMIC_API_BASE_URL || import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error('[Student API] API_BASE_URL is not configured. Please set VITE_ACADEMIC_API_BASE_URL or VITE_API_BASE_URL in your .env file');
}

async function getAuthHeaders() {
  let session = getSession();
  
  // Prefer id_token (JWT containing user identity claims) for API Gateway
  let tokenToUse = session.id_token && session.id_token.trim() !== '' ? session.id_token : session.access_token;
  
  // Check if token is expired
  if (isTokenExpired(tokenToUse)) {
    console.log('[Student API] Token expired, refreshing...');
    try {
      session = await refreshTokens();
      tokenToUse = session.id_token && session.id_token.trim() !== '' ? session.id_token : session.access_token;
      console.log('[Student API] Token refreshed successfully');
    } catch (error) {
      console.error('[Student API] Token refresh failed:', error);
      throw error;
    }
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokenToUse}`
  };
}

// Helper function to handle fetch with better error handling
async function fetchWithErrorHandling(url, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('API base URL is not configured. Please check your environment variables.');
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch (e) {
        error = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new Error(error.error || error.message || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      throw new Error('Network error: Unable to connect to server. Please check your internet connection and API configuration.');
    }
    // Re-throw other errors
    throw error;
  }
}

function buildStudentUrl(path) {
  // path: e.g. 'students' or 'students/123' or '/students/123'
  const trimmedPath = String(path).replace(/^\//, "");
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}/academic/${trimmedPath}`;
}

/**
 * Get list of all students with optional filters
 * @param {Object} params - Query parameters (name, phone, email, status)
 * @returns {Promise} API response with student list
 */
export const getStudents = async (params = {}) => {
  const headers = await getAuthHeaders();
  const queryParams = new URLSearchParams();
  
  if (params.name) queryParams.append('name', params.name);
  if (params.phone) queryParams.append('phone', params.phone);
  if (params.email) queryParams.append('email', params.email);
  if (params.status) queryParams.append('status', params.status);
  
  const queryString = queryParams.toString();
  const url = queryString 
    ? `${buildStudentUrl('students')}?${queryString}`
    : buildStudentUrl('students');
  
  return await fetchWithErrorHandling(url, {
    method: 'GET',
    headers
  });
};

/**
 * Get detailed information about a specific student
 * @param {string} studentId - Student ID
 * @returns {Promise} API response with student details
 */
export const getStudent = async (studentId) => {
  const headers = await getAuthHeaders();
  return await fetchWithErrorHandling(buildStudentUrl(`students/${studentId}`), {
    method: 'GET',
    headers
  });
};

/**
 * Search students by criteria
 * @param {Object} searchCriteria - Search parameters
 * @returns {Promise} API response with search results
 */
export const searchStudents = async (searchCriteria) => {
  const headers = await getAuthHeaders();
  return await fetchWithErrorHandling(buildStudentUrl('students/search'), {
    method: 'POST',
    headers,
    body: JSON.stringify(searchCriteria)
  });
};

/**
 * Create a new student
 * @param {Object} studentData - Student data
 * @returns {Promise} API response with created student
 */
export const createStudent = async (studentData) => {
  const headers = await getAuthHeaders();
  return await fetchWithErrorHandling(buildStudentUrl('students'), {
    method: 'POST',
    headers,
    body: JSON.stringify(studentData)
  });
};

/**
 * Update student information
 * @param {string} studentId - Student ID
 * @param {Object} studentData - Updated student data
 * @returns {Promise} API response with updated student
 */
export const updateStudent = async (studentId, studentData) => {
  const headers = await getAuthHeaders();
  return await fetchWithErrorHandling(buildStudentUrl(`students/${studentId}`), {
    method: 'PUT',
    headers,
    body: JSON.stringify(studentData)
  });
};

/**
 * Delete a student
 * @param {string} studentId - Student ID
 * @returns {Promise} API response
 */
export const deleteStudent = async (studentId) => {
  const headers = await getAuthHeaders();
  try {
    const response = await fetch(buildStudentUrl(`students/${studentId}`), {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch (e) {
        error = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new Error(error.error || error.message || 'Delete failed');
    }

    // 204 No Content has no body
    if (response.status === 204) {
      return { success: true };
    }

    const text = await response.text();
    if (text) {
      return JSON.parse(text);
    }

    return { success: true };
  } catch (error) {
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      throw new Error('Network error: Unable to connect to server. Please check your internet connection and API configuration.');
    }
    throw error;
  }
};

/**
 * Update student status
 * @param {string} studentId - Student ID
 * @param {Object} statusData - Status update data
 * @returns {Promise} API response
 */
export const updateStudentStatus = async (studentId, statusData) => {
  const headers = await getAuthHeaders();
  return await fetchWithErrorHandling(buildStudentUrl(`students/${studentId}/status`), {
    method: 'PUT',
    headers,
    body: JSON.stringify(statusData)
  });
};

/**
 * Get student status history
 * @param {string} studentId - Student ID
 * @returns {Promise} API response with status history
 */
export const getStatusHistory = async (studentId) => {
  const headers = await getAuthHeaders();
  return await fetchWithErrorHandling(buildStudentUrl(`students/${studentId}/status/history`), {
    method: 'GET',
    headers
  });
};

/**
 * Add note to student record
 * @param {string} studentId - Student ID
 * @param {Object} noteData - Note data
 * @returns {Promise} API response
 */
export const addNote = async (studentId, noteData) => {
  const headers = await getAuthHeaders();
  return await fetchWithErrorHandling(buildStudentUrl(`students/${studentId}/notes`), {
    method: 'POST',
    headers,
    body: JSON.stringify(noteData)
  });
};

/**
 * Get student notes
 * @param {string} studentId - Student ID
 * @returns {Promise} API response with notes
 */
export const getNotes = async (studentId) => {
  const headers = await getAuthHeaders();
  return await fetchWithErrorHandling(buildStudentUrl(`students/${studentId}/notes`), {
    method: 'GET',
    headers
  });
};

/**
 * Get student dashboard (aggregated data: student info + academic info)
 * Uses the BFF aggregator pattern to fetch all data in one API call
 * @param {string} studentId - Student ID
 * @returns {Promise} API response with { studentInfo, academicInfo }
 * Note: This endpoint returns academic summary (enrollments, grades, attendance)
 * Student info should be fetched separately using getStudent()
 */
export const getStudentDashboard = async (studentId) => {
  const headers = await getAuthHeaders();
  // Use the correct endpoint: /academic/summary/{studentId}
  return await fetchWithErrorHandling(buildStudentUrl(`summary/${studentId}`), {
    method: 'GET',
    headers
  });
};
