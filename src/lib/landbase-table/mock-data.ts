/**
 * GTM Demo Mock Data
 *
 * EXTERNAL API ALTERNATIVES
 * -------------------------
 * To switch to a real API, set USE_EXTERNAL_API = true and uncomment
 * the desired fetch function.
 *
 * Option 1: DummyJSON (users with company data)
 *   const res = await fetch('https://dummyjson.com/users?limit=15');
 *   const { users } = await res.json();
 *   // Transform: users.map(u => ({ id: u.id, company: u.company.name, contact: `${u.firstName} ${u.lastName}`, ... }))
 *
 * Option 2: JSONPlaceholder (users + companies)
 *   const res = await fetch('https://jsonplaceholder.typicode.com/users');
 *   const users = await res.json();
 *   // Transform: users.map(u => ({ id: u.id, company: u.company.name, contact: u.name, email: u.email, ... }))
 *
 * Option 3: MockAPI.io (create your own schema)
 *   1. Go to https://mockapi.io/
 *   2. Create a "leads" resource with GTM fields
 *   3. Use: fetch('https://YOUR_PROJECT.mockapi.io/leads')
 */
const USE_EXTERNAL_API = false; // Toggle to true to use external API

export interface GTMLead {
  id: string;
  company: string;
  contact: string;
  title: string;
  email: string;
  signals: string[];
  score: number;
  [key: string]: unknown;
}

export interface ColumnDefinition {
  id: string;
  label: string;
  accessor: string;
}

// Initial columns shown in table
export const INITIAL_COLUMNS: ColumnDefinition[] = [
  { id: 'company', label: 'Company', accessor: 'company' },
  { id: 'contact', label: 'Contact', accessor: 'contact' },
  { id: 'title', label: 'Title', accessor: 'title' },
  { id: 'email', label: 'Email', accessor: 'email' },
  { id: 'signals', label: 'Signals', accessor: 'signals' },
];

// Mock GTM leads data
export const MOCK_LEADS: GTMLead[] = [
  { id: '1', company: 'Acme Corp', contact: 'John Smith', title: 'VP of Engineering', email: 'jsmith@acme.com', signals: ['Job posting', 'Tech stack match'], score: 85 },
  { id: '2', company: 'TechStart Inc', contact: 'Sarah Chen', title: 'CTO', email: 'schen@techstart.io', signals: ['Recent funding', 'Expansion'], score: 92 },
  { id: '3', company: 'GlobalSoft', contact: 'Mike Johnson', title: 'Director of IT', email: 'mjohnson@globalsoft.com', signals: ['RFP issued'], score: 78 },
  { id: '4', company: 'DataDriven LLC', contact: 'Emily Wong', title: 'Head of Data', email: 'ewong@datadriven.co', signals: ['Competitor churn', 'Growth signal'], score: 88 },
  { id: '5', company: 'CloudNine Systems', contact: 'Alex Rivera', title: 'VP of Operations', email: 'arivera@cloudnine.io', signals: ['Infrastructure upgrade'], score: 71 },
  { id: '6', company: 'Innovate Labs', contact: 'Jessica Park', title: 'CEO', email: 'jpark@innovatelabs.com', signals: ['Series B', 'Hiring spree'], score: 95 },
  { id: '7', company: 'SecureNet', contact: 'David Kim', title: 'CISO', email: 'dkim@securenet.com', signals: ['Compliance deadline'], score: 82 },
  { id: '8', company: 'ScaleUp Partners', contact: 'Lisa Thompson', title: 'COO', email: 'lthompson@scaleup.vc', signals: ['Portfolio expansion'], score: 67 },
  { id: '9', company: 'FutureTech', contact: 'Ryan O\'Brien', title: 'CIO', email: 'robrien@futuretech.io', signals: ['Digital transformation', 'Budget approval'], score: 90 },
  { id: '10', company: 'MegaCorp Industries', contact: 'Amanda Foster', title: 'SVP Technology', email: 'afoster@megacorp.com', signals: ['Vendor consolidation'], score: 76 },
  { id: '11', company: 'StartupXYZ', contact: 'Chris Martinez', title: 'Founder & CTO', email: 'cmartinez@startupxyz.com', signals: ['Seed funding', 'Product launch'], score: 84 },
  { id: '12', company: 'Enterprise Solutions', contact: 'Nancy Lee', title: 'VP Engineering', email: 'nlee@enterprise.com', signals: ['Contract renewal', 'Team growth'], score: 79 },
];

// Dynamic column value generators (mock data for new columns)
const COLUMN_DATA_GENERATORS: Record<string, (lead: GTMLead) => string> = {
  funding: (lead) => {
    const fundingData: Record<string, string> = {
      '1': '$50M Series C',
      '2': '$15M Series A',
      '3': '$200M (Public)',
      '4': '$8M Seed',
      '5': '$30M Series B',
      '6': '$45M Series B',
      '7': '$75M Series D',
      '8': '$500M AUM',
      '9': '$120M Series C',
      '10': '$2B (Public)',
      '11': '$2M Seed',
      '12': '$60M Series B',
    };
    return fundingData[lead.id] || 'Unknown';
  },
  tech_stack: (lead) => {
    const techData: Record<string, string> = {
      '1': 'AWS, React, Python',
      '2': 'GCP, Vue, Go',
      '3': 'Azure, .NET, SQL',
      '4': 'Snowflake, dbt, Python',
      '5': 'AWS, Node, MongoDB',
      '6': 'GCP, React, Rust',
      '7': 'On-prem, Java, Oracle',
      '8': 'AWS, Next.js, PostgreSQL',
      '9': 'Multi-cloud, K8s, Java',
      '10': 'Azure, C#, SAP',
      '11': 'Vercel, React, Supabase',
      '12': 'AWS, Python, Redis',
    };
    return techData[lead.id] || 'Unknown';
  },
  employee_count: (lead) => {
    const empData: Record<string, string> = {
      '1': '450',
      '2': '85',
      '3': '2,500',
      '4': '120',
      '5': '340',
      '6': '95',
      '7': '780',
      '8': '45',
      '9': '1,200',
      '10': '15,000',
      '11': '12',
      '12': '650',
    };
    return empData[lead.id] || 'Unknown';
  },
  industry: (lead) => {
    const industryData: Record<string, string> = {
      '1': 'Manufacturing',
      '2': 'SaaS',
      '3': 'Enterprise Software',
      '4': 'Data Analytics',
      '5': 'Cloud Services',
      '6': 'AI/ML',
      '7': 'Cybersecurity',
      '8': 'Venture Capital',
      '9': 'FinTech',
      '10': 'Conglomerate',
      '11': 'Developer Tools',
      '12': 'Enterprise SaaS',
    };
    return industryData[lead.id] || 'Unknown';
  },
  last_activity: (lead) => {
    const activityData: Record<string, string> = {
      '1': '2 days ago',
      '2': 'Yesterday',
      '3': '1 week ago',
      '4': '3 days ago',
      '5': '5 days ago',
      '6': 'Today',
      '7': '2 weeks ago',
      '8': '4 days ago',
      '9': 'Yesterday',
      '10': '1 week ago',
      '11': 'Today',
      '12': '3 days ago',
    };
    return activityData[lead.id] || 'Unknown';
  },
  competitor_status: (lead) => {
    const competitorData: Record<string, string> = {
      '1': 'Using Competitor A',
      '2': 'No competitor',
      '3': 'Using Competitor B',
      '4': 'Evaluating options',
      '5': 'Using legacy system',
      '6': 'No competitor',
      '7': 'Using Competitor A',
      '8': 'Using Competitor C',
      '9': 'Multi-vendor',
      '10': 'Using Competitor B',
      '11': 'No competitor',
      '12': 'Using Competitor A',
    };
    return competitorData[lead.id] || 'Unknown';
  },
};

// Map user requests to column IDs
export function parseColumnRequest(request: string): { id: string; label: string } | null {
  const lowerRequest = request.toLowerCase();

  if (lowerRequest.includes('funding')) {
    return { id: 'funding', label: 'Recent Funding' };
  }
  if (lowerRequest.includes('tech') || lowerRequest.includes('stack')) {
    return { id: 'tech_stack', label: 'Tech Stack' };
  }
  if (lowerRequest.includes('employee') || lowerRequest.includes('headcount') || lowerRequest.includes('size')) {
    return { id: 'employee_count', label: 'Employees' };
  }
  if (lowerRequest.includes('industry') || lowerRequest.includes('sector') || lowerRequest.includes('vertical')) {
    return { id: 'industry', label: 'Industry' };
  }
  if (lowerRequest.includes('activity') || lowerRequest.includes('engagement') || lowerRequest.includes('last')) {
    return { id: 'last_activity', label: 'Last Activity' };
  }
  if (lowerRequest.includes('competitor') || lowerRequest.includes('competition')) {
    return { id: 'competitor_status', label: 'Competitor Status' };
  }

  return null;
}

// Simulate fetching data for a specific cell with delay
export async function fetchCellValue(
  leadId: string,
  columnId: string,
  delay: number = 200
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, delay));

  const lead = MOCK_LEADS.find((l) => l.id === leadId);
  if (!lead) return 'N/A';

  const generator = COLUMN_DATA_GENERATORS[columnId];
  if (!generator) return 'N/A';

  return generator(lead);
}

// Simulate fetching all leads (for external API mode)
export async function fetchLeads(): Promise<GTMLead[]> {
  if (USE_EXTERNAL_API) {
    // Uncomment one of these when switching to external API:
    // const res = await fetch('https://dummyjson.com/users?limit=15');
    // const { users } = await res.json();
    // return users.map(...);

    // const res = await fetch('https://jsonplaceholder.typicode.com/users');
    // const users = await res.json();
    // return users.map(...);
  }

  // Default: return mock data
  await new Promise((resolve) => setTimeout(resolve, 100));
  return MOCK_LEADS;
}

// Demo prompts for the chat UI
export const DEMO_PROMPTS = [
  'Add a column showing recent funding rounds',
  'Add a column for their tech stack',
  'Add a column showing employee count',
  'Add a column for industry classification',
  'Add a column for last activity date',
  'Add a column showing competitor status',
];

// Chain of thought steps for adding a column
export function getChainOfThoughtSteps(columnLabel: string): string[] {
  return [
    'Understanding request...',
    `Researching ${columnLabel.toLowerCase()} data...`,
    'Querying data sources...',
    'Populating cells...',
  ];
}
