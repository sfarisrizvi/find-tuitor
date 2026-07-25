// Utility helper for pushing custom events to Google Tag Manager dataLayer

export const pushToDataLayer = (event, eventData = {}) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event,
      ...eventData,
      timestamp: new Date().toISOString(),
    });
  }
};

export const trackSearch = (query, city, resultsCount) => {
  pushToDataLayer('tutor_search_performed', {
    search_query: query || '',
    search_city: city || 'All Cities',
    results_count: resultsCount || 0,
  });
};

export const trackTutorView = (tutorId, tutorName, hourlyRate) => {
  pushToDataLayer('tutor_profile_viewed', {
    tutor_id: tutorId,
    tutor_name: tutorName,
    hourly_rate: hourlyRate,
  });
};

export const trackDemoBooked = (tutorId, tutorName) => {
  pushToDataLayer('demo_session_requested', {
    tutor_id: tutorId,
    tutor_name: tutorName,
  });
};
