import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAcademic } from '../../api/academic';
import EnrollModal from './EnrollModal';
import './StudentSearchPage.css';

export default function StudentSearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (query.trim().length < 2) {
      setError('Please enter at least 2 characters');
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const response = await searchAcademic(query.trim());
      if (response.success) {
        setSearchResults(response.data.results);
      } else {
        throw new Error(response.message || 'Search failed');
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleEnroll = (classItem) => {
    setSelectedClass(classItem);
    setShowEnrollModal(true);
  };

  const handleEnrollSuccess = () => {
    setShowEnrollModal(false);
    setSelectedClass(null);
    // Navigate to my courses
    navigate('/student/courses');
  };

  const handleEnrollCancel = () => {
    setShowEnrollModal(false);
    setSelectedClass(null);
  };

  return (
    <div className="student-search-page">
      <div className="search-header">
        <h1>Search Courses & Classes</h1>
        <p className="subtitle">Find and enroll in available classes</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by course name, code, class code, teacher name..."
            className="search-input"
            autoFocus
          />
          <button 
            type="submit" 
            className="search-button"
            disabled={searching || query.trim().length < 2}
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Search Results */}
      {searchResults && (
        <div className="search-results">
          <div className="results-summary">
            <h2>Search Results for "{query}"</h2>
            <p className="results-count">
              Found {searchResults.courses.length} courses, 
              {searchResults.classes.length} classes, 
              {searchResults.teachers.length} teachers
            </p>
          </div>

          {/* Courses */}
          {searchResults.courses.length > 0 && (
            <div className="result-section">
              <h3>📚 Courses</h3>
              <div className="courses-grid">
                {searchResults.courses.map((course) => (
                  <div key={course.courseId} className="course-result-card">
                    <div className="course-header">
                      <h4>{course.courseName}</h4>
                      <span className="course-code">{course.courseCode}</span>
                    </div>
                    <p className="course-description">
                      {course.description || 'No description available'}
                    </p>
                    <div className="course-meta">
                      <span className="meta-badge">📖 {course.credits} credits</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Classes */}
          {searchResults.classes.length > 0 && (
            <div className="result-section">
              <h3>🏫 Classes</h3>
              <div className="classes-list">
                {searchResults.classes.map((classItem) => (
                  <div key={classItem.classId} className="class-result-card">
                    <div className="class-header">
                      <div className="class-info">
                        <h4>
                          {classItem.courseName || classItem.courseCode}
                          <span className="class-code">{classItem.classCode}</span>
                        </h4>
                        <p className="class-meta">
                          {classItem.semester} {classItem.year} • {classItem.courseCode}
                        </p>
                      </div>
                      <span className={`status-badge status-${classItem.status?.toLowerCase()}`}>
                        {classItem.status}
                      </span>
                    </div>

                    <div className="class-details">
                      <div className="detail-item">
                        <span className="detail-icon">📅</span>
                        <span>{classItem.schedule || 'Schedule TBA'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">🏢</span>
                        <span>{classItem.room || 'Room TBA'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">👥</span>
                        <span>{classItem.enrolled || 0} / {classItem.capacity || 0} enrolled</span>
                      </div>
                    </div>

                    <div className="class-actions">
                      {classItem.status === 'OPEN' ? (
                        <button 
                          className="btn-enroll"
                          onClick={() => handleEnroll(classItem)}
                        >
                          Enroll
                        </button>
                      ) : classItem.status === 'FULL' ? (
                        <button className="btn-disabled" disabled>
                          Class Full
                        </button>
                      ) : (
                        <button className="btn-disabled" disabled>
                          Not Available
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teachers */}
          {searchResults.teachers.length > 0 && (
            <div className="result-section">
              <h3>👨‍🏫 Teachers</h3>
              <div className="teachers-grid">
                {searchResults.teachers.map((teacher) => (
                  <div key={teacher.teacherId} className="teacher-result-card">
                    <h4>{teacher.name}</h4>
                    <p className="teacher-code">{teacher.teacherCode}</p>
                    {teacher.specialization && (
                      <p className="teacher-spec">🎓 {teacher.specialization}</p>
                    )}
                    {teacher.department && (
                      <p className="teacher-dept">🏛️ {teacher.department}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {searchResults.courses.length === 0 && 
           searchResults.classes.length === 0 && 
           searchResults.teachers.length === 0 && (
            <div className="no-results">
              <p>No results found for "{query}"</p>
              <p className="no-results-hint">Try different keywords or check spelling</p>
            </div>
          )}
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && selectedClass && (
        <EnrollModal
          classData={selectedClass}
          onSuccess={handleEnrollSuccess}
          onCancel={handleEnrollCancel}
        />
      )}
    </div>
  );
}
