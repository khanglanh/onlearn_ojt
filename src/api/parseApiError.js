// Normalize API errors to provide a single readable message for the UI
export function parseApiError(err) {
  // Axios errors:
  const resp = err?.response;

  // 1) If backend returns standardized error shape using ApiResponse.error
  //    ApiResponse.error() returns { success: false, error: <message> }
  if (resp?.data) {
    const data = resp.data;

    // If backend produced our ApiResponse object
    if (typeof data === 'object') {
      if (data.error) {
        const mapped = mapBackendMessage(data.error);
        return { message: mapped, status: resp.status, raw: data };
      }
      if (data.message) {
        const mapped = mapBackendMessage(data.message);
        return { message: mapped, status: resp.status, raw: data };
      }
      // Sometimes the useful error is wrapped inside data.data.message
      if (data.data && typeof data.data === 'object' && data.data.message) {
        const mapped = mapBackendMessage(data.data.message);
        return { message: mapped, status: resp.status, raw: data };
      }
    }
  }

// Map common backend error texts to friendlier/localized messages
function mapBackendMessage(msg) {
  if (!msg) return msg;
  const text = String(msg);

  // Exact / substring matches we care about
  if (/User already exists/i.test(text) || /user already exists/i.test(text)) {
    return 'Người dùng đã tồn tại';
  }
  if (/Invite already sent/i.test(text) || /invite already sent/i.test(text)) {
    return 'Lời mời đã được gửi trước đó';
  }
  if (/Invite already used/i.test(text) || /invite already used/i.test(text)) {
    return 'Lời mời đã được sử dụng';
  }
  if (/Invite expired/i.test(text) || /invite expired/i.test(text)) {
    return 'Lời mời đã hết hạn';
  }
  if (/Token is required/i.test(text)) {
    return 'Liên kết mời không hợp lệ hoặc đã hết hạn';
  }

  // Fallback: return original message
  return text;
}

  // 2) Fallback to Axios / network error message
  if (err?.message) {
    // Common axios message for HTTP errors: "Request failed with status code 500"
    // We prefer to show the backend message when available. If not, show a friendlier message.
    const msg = err.message;
    // map generic axios status text to friendlier UI text
    if (/Request failed with status code (\d+)/i.test(msg)) {
      const status = parseInt(msg.match(/(\d+)/)[0], 10);
      if (status >= 500) {
        return { message: 'Server error. Please try again later.', status, raw: err };
      }
      if (status === 404) {
        return { message: 'Not found. Please check the request and try again.', status, raw: err };
      }
      if (status === 401) {
        return { message: 'Unauthorized. Please sign in and try again.', status, raw: err };
      }
      // default for other 4xx
      return { message: 'Request failed. Please check your input and try again.', status, raw: err };
    }

    // Non-HTTP / network
    return { message: msg, status: null, raw: err };
  }

  // Last fallback
  return { message: 'An unknown error occurred', status: null, raw: err };
}

export default parseApiError;
