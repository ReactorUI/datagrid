import { HttpConfig, ServerRequest, ServerResponse } from '../types';

// Data formatting utilities
export const formatters = {
  date: (value: string, includeTime = false) => {
    if (!value) return '';
    const date = new Date(value);
    return includeTime ? date.toLocaleString() : date.toLocaleDateString();
  },

  currency: (value: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value);
  },

  number: (value: number, decimals = 0) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  },

  truncate: (text: string, length: number) => {
    if (!text || text.length <= length) return text;
    return text.substring(0, length) + '...';
  },
};

// Filter comparison functions
export const compareValues = (
  dataValue: any,
  filterValue: any,
  operator: string,
  dataType: string
): boolean => {
  if (dataValue == null) return false;

  switch (dataType) {
    case 'string':
      const str = dataValue.toString().toLowerCase();
      const filter = filterValue.toString().toLowerCase();

      switch (operator) {
        case 'eq':
          return str === filter;
        case 'contains':
          return str.includes(filter);
        case 'startsWith':
          return str.startsWith(filter);
        case 'endsWith':
          return str.endsWith(filter);
        default:
          return str.includes(filter);
      }

    case 'number':
      const num = parseFloat(dataValue);
      const filterNum = parseFloat(filterValue);

      switch (operator) {
        case 'eq':
          return num === filterNum;
        case 'gt':
          return num > filterNum;
        case 'gte':
          return num >= filterNum;
        case 'lt':
          return num < filterNum;
        case 'lte':
          return num <= filterNum;
        default:
          return num === filterNum;
      }

    case 'date':
    case 'datetime':
      const date = new Date(dataValue).getTime();
      const filterDate = new Date(filterValue).getTime();

      switch (operator) {
        case 'eq':
          return date === filterDate;
        case 'gt':
          return date > filterDate;
        case 'gte':
          return date >= filterDate;
        case 'lt':
          return date < filterDate;
        case 'lte':
          return date <= filterDate;
        default:
          return date === filterDate;
      }

    case 'boolean':
      return Boolean(dataValue) === Boolean(filterValue);

    default:
      return String(dataValue).toLowerCase().includes(String(filterValue).toLowerCase());
  }
};

// API utilities
export const createApiRequest = async <T>(
  endpoint: string,
  request: ServerRequest,
  config: HttpConfig = {}
): Promise<ServerResponse<T>> => {
  const {
    method = 'GET',
    bearerToken,
    apiKey,
    customHeaders = {},
    withCredentials = false,
    timeout = 30000,
  } = config;

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  // Build request
  const requestOptions: RequestInit = {
    method,
    headers,
    credentials: withCredentials ? 'include' : 'same-origin',
  };

  let url = endpoint;

  if (method === 'POST') {
    requestOptions.body = JSON.stringify({ request });
  } else {
    const params = new URLSearchParams({ request: JSON.stringify(request) });
    url = `${endpoint}?${params.toString()}`;
  }

  // Create timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  requestOptions.signal = controller.signal;

  try {
    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return mapServerResponse<T>(data);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Map various server response formats to our standard format
export const mapServerResponse = <T>(data: any): ServerResponse<T> => {
  // Handle array format [pagedResult, metadata]
  if (Array.isArray(data)) {
    const pagedResult = data[0];
    return {
      items: pagedResult?.Items || pagedResult?.items || pagedResult || [],
      count: pagedResult?.Count || pagedResult?.count || pagedResult?.length || 0,
      hasMore: pagedResult?.HasMore || pagedResult?.hasMore || false,
    };
  }

  // Handle standard formats
  if (data.items || data.Items) {
    return {
      items: data.items || data.Items || [],
      count: data.count || data.Count || 0,
      hasMore: data.hasMore || data.HasMore || false,
    };
  }

  // Handle pagination wrappers (Laravel, etc.)
  if (data.data && Array.isArray(data.data)) {
    return {
      items: data.data,
      count: data.total || data.count || data.data.length,
      hasMore: data.hasNextPage || data.has_next_page || false,
    };
  }

  // Fallback
  return {
    items: Array.isArray(data) ? data : [],
    count: Array.isArray(data) ? data.length : 0,
    hasMore: false,
  };
};

// Sorting utilities
export const sortData = <T>(data: T[], sortColumn: string, direction: 'asc' | 'desc'): T[] => {
  if (!sortColumn) return data;

  return [...data].sort((a, b) => {
    const aVal = (a as any)[sortColumn];
    const bVal = (b as any)[sortColumn];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();

    const result = aStr.localeCompare(bStr, undefined, { numeric: true });
    return direction === 'desc' ? -result : result;
  });
};
