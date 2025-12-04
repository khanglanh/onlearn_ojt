// Academic Service API Client
import { getSession, refreshTokens, isTokenExpired } from './auth';
import { getUserRole } from '../utils/authUtils';

const API_BASE_URL = import.meta.env.VITE_ACADEMIC_API_BASE_URL || import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error('[Academic API] API_BASE_URL is not configured. Please set VITE_ACADEMIC_API_BASE_URL or VITE_API_BASE_URL in your .env file');
}

export const academicApi = {
  getMyProfile,
  searchAcademic,
  enrollInClass,
  getMyEnrollments,
  unenrollFromClass,
  getTeacherCourses,
  getTeacherClasses,
  listTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  generateImportUploadUrl,
  uploadFileToS3,
  getImportJobStatus,
  listImportJobs,
  getCourse,
  getClass,
  listCourses,
  listClasses,
  createMaterialsFolder,
  generateMaterialsUploadUrl,
  listMaterials,
  generateMaterialsDownloadUrl
};

async function getAuthHeaders() {
  let session = getSession();
  
  // Prefer id_token (JWT containing user identity claims) for API Gateway
  // Cognito authorizers commonly validate the ID token's claims. Fall back to
  // access_token when id_token is absent to preserve compatibility.
  let tokenToUse = session.id_token && session.id_token.trim() !== '' ? session.id_token : session.access_token;
  
  // Check if token is expired
  if (isTokenExpired(tokenToUse)) {
    console.log('[Academic API] Token expired, refreshing...');
    try {
      session = await refreshTokens();
      // Get refreshed tokens
      tokenToUse = session.id_token && session.id_token.trim() !== '' ? session.id_token : session.access_token;
      console.log('[Academic API] Token refreshed successfully');
    } catch (error) {
      console.error('[Academic API] Token refresh failed:', error);
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

// ==================== Profile ====================

export async function getMyProfile() {
  const headers = await getAuthHeaders();
  const role = getUserRole();
  
  // Determine endpoint based on role
  let endpoint;
  if (role === 'TEACHER') {
    endpoint = `${API_BASE_URL}/academic/teachers/me`;
  } else if (role === 'STUDENT') {
    endpoint = `${API_BASE_URL}/academic/students/me`;
  } else if (role === 'ADMIN' || role === 'MANAGER') {
    // Admin/Manager can use either endpoint, but we'll use teachers/me as it's more generic
    // The backend will handle returning admin profile from token claims
    endpoint = `${API_BASE_URL}/academic/teachers/me`;
  } else {
    throw new Error(`Invalid role: ${role}. Only STUDENT, TEACHER, ADMIN, and MANAGER can access profile.`);
  }

  return await fetchWithErrorHandling(endpoint, {
    method: 'GET',
    headers
  });
}

// ==================== Search ====================

export async function searchAcademic(query) {
  const headers = await getAuthHeaders();
  return await fetchWithErrorHandling(`${API_BASE_URL}/academic/search?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers
  });
}

// ==================== Enrollment ====================

export async function enrollInClass(classId, enrollKey) {
  const headers = await getAuthHeaders();

  const profileResponse = await getMyProfile();
  if (!profileResponse.success || !profileResponse.data?.studentId) {
    throw new Error(profileResponse.message || "Student profile not found");
  }

  const studentId = profileResponse.data.studentId;

  return await fetchWithErrorHandling(`${API_BASE_URL}/academic/enrollments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      classId,
      studentId,
      enrollKey, // nếu backend dùng tên khác (vd: enrollmentKey) thì đổi ở đây
    }),
  });
}



export async function getMyEnrollments() {
  const headers = await getAuthHeaders();
  
  // Get my profile to get studentId
  const profileResponse = await getMyProfile();
  if (!profileResponse.success || !profileResponse.data.studentId) {
    throw new Error('Student profile not found');
  }

  const studentId = profileResponse.data.studentId;

  return await fetchWithErrorHandling(`${API_BASE_URL}/academic/enrollments?studentId=${studentId}`, {
    method: 'GET',
    headers
  });
}

// Get all enrollments (for admin/manager)
export async function getAllEnrollments(params = {}) {
  const headers = await getAuthHeaders();
  const queryParams = new URLSearchParams();
  
  if (params.studentId) queryParams.append('studentId', params.studentId);
  if (params.classId) queryParams.append('classId', params.classId);
  
  const queryString = queryParams.toString();
  const url = queryString 
    ? `${API_BASE_URL}/academic/enrollments?${queryString}`
    : `${API_BASE_URL}/academic/enrollments`;

  return await fetchWithErrorHandling(url, {
    method: 'GET',
    headers
  });
}

export async function unenrollFromClass(enrollmentId) {
  const headers = await getAuthHeaders();
  
  try {
    const response = await fetch(`${API_BASE_URL}/academic/enrollments/${enrollmentId}`, {
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
      throw new Error(error.error || error.message || 'Unenroll failed');
    }

    // 204 No Content has no body, so don't try to parse JSON
    if (response.status === 204) {
      return { success: true };
    }

    // If there's a body, parse it
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
}


// Tạo đăng ký lịch học (ADMIN)
export async function createEnrollmentSchedule(payload) {
  console.log('[createEnrollmentSchedule] payload =', payload);
  const headers = await getAuthHeaders();

  return await fetchWithErrorHandling(
    `${API_BASE_URL}/academic/enrollments/schedules`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }
  );
}

// Cập nhật trạng thái enrollment (ADMIN)
export async function updateEnrollmentStatus(enrollmentId, status) {
  const headers = await getAuthHeaders();

  return await fetchWithErrorHandling(
    `${API_BASE_URL}/academic/enrollments/${enrollmentId}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({ status }),
    }
  );
}

// ==================== Teacher APIs ====================

export async function getTeacherCourses(teacherId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/academic/teachers/${teacherId}/courses`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get courses');
  }

  return await response.json();
}

export async function getTeacherClasses(teacherId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/academic/teachers/${teacherId}/classes`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get classes');
  }

  return await response.json();
}

export async function listTeachers() {
  const url = `${API_BASE_URL}/academic/teachers`;
  console.log('[listTeachers] Fetching from:', url);
  
  const headers = await getAuthHeaders();
  console.log('[listTeachers] Headers:', { ...headers, Authorization: 'Bearer [REDACTED]' });
  
  try {
    const data = await fetchWithErrorHandling(url, {
      method: 'GET',
      headers
    });
    console.log('[listTeachers] Success, received teachers:', data);
    return data;
  } catch (error) {
    console.error('[listTeachers] Fetch error:', error);
    throw error;
  }
}

export async function getTeacher(teacherId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/academic/teachers/${teacherId}`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get teacher');
  }

  return await response.json();
}

export async function createTeacher(teacherData) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/academic/teachers`, {
    method: 'POST',
    headers,
    body: JSON.stringify(teacherData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create teacher');
  }

  return await response.json();
}

export async function updateTeacher(teacherId, teacherData) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/academic/teachers/${teacherId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(teacherData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update teacher');
  }

  return await response.json();
}

export async function deleteTeacher(teacherId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/academic/teachers/${teacherId}`, {
    method: 'DELETE',
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete teacher');
  }

  return await response.json();
}

// ==================== Import APIs (ADMIN/MANAGER only) ====================

export async function generateImportUploadUrl(fileName) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/academic/import/upload-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fileName })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate upload URL');
  }

  return await response.json();
}

export async function uploadFileToS3(presignedUrl, file, requiredHeaders = {}) {
  const headers = {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ...requiredHeaders
  };

  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers,
    body: file
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to upload file to S3: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return true;
}

export async function getImportJobStatus(jobId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/academic/import/jobs/${jobId}`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get job status');
  }

  return await response.json();
}

export async function listImportJobs(limit = 20, lastKey = null) {
  const headers = await getAuthHeaders();
  let url = `${API_BASE_URL}/academic/import/jobs?limit=${limit}`;
  if (lastKey) {
    url += `&lastKey=${encodeURIComponent(lastKey)}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to list import jobs');
  }

  return await response.json();
}

// ==================== Course & Class APIs ====================

export async function getCourse(courseId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/academic/courses/${courseId}`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get course');
  }

  return await response.json();
}

export async function getClass(classId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/academic/classes/${classId}`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get class');
  }

  return await response.json();
}

export async function listCourses() {
  const headers = await getAuthHeaders();
  return await fetchWithErrorHandling(`${API_BASE_URL}/academic/courses`, {
    method: 'GET',
    headers
  });
}

export async function listClasses() {
  const headers = await getAuthHeaders();
  return await fetchWithErrorHandling(`${API_BASE_URL}/academic/classes`, {
    method: 'GET',
    headers
  });
}

// ==================== Materials APIs ====================

export async function createMaterialsFolder(courseId, classId, folderName) {
  const headers = await getAuthHeaders();
  return await fetchWithErrorHandling(`${API_BASE_URL}/academic/courses/${courseId}/classes/${classId}/materials/folder`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ folderName })
  });
}

export async function generateMaterialsUploadUrl(courseId, classId, fileName, contentType, fileSize, folder = 'General') {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/academic/courses/${courseId}/classes/${classId}/materials/upload-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fileName,
      contentType,
      fileSize,
      folder
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate upload URL');
  }

  return await response.json();
}

export async function listMaterials(courseId, classId, folder = null) {
  const headers = await getAuthHeaders();
  let url = `${API_BASE_URL}/academic/courses/${courseId}/classes/${classId}/materials`;
  if (folder) {
    url += `?folder=${encodeURIComponent(folder)}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to list materials');
  }

  return await response.json();
}

export async function generateMaterialsDownloadUrl(materialId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/academic/materials/${materialId}/download-url`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate download URL');
  }

  return await response.json();
}

