
import { Client, Lead, Message } from './types';

// Helper to generate mock conversation history
const generateMockHistory = (name: string, service: string): Message[] => [
  { role: 'user', content: `Hi, I'm looking for a quote on ${service}.`, timestamp: '10:00 AM' },
  { role: 'assistant', content: `Thanks for reaching out! We can definitely help with ${service}. Are you looking for residential or commercial work?`, timestamp: '10:01 AM' },
  { role: 'user', content: 'Residential. It is for my home.', timestamp: '10:02 AM' },
  { role: 'assistant', content: 'Great. I can have an estimator out there tomorrow or Thursday. Which works better?', timestamp: '10:02 AM' },
  { role: 'user', content: 'Thursday morning works.', timestamp: '10:05 AM' },
  { role: 'assistant', content: `Perfect. I've marked you down for Thursday morning. someone from the team will call you shortly to confirm the exact time.`, timestamp: '10:05 AM' }
];

// Helper to generate a large list of leads for the Demo
const generateDemoLeads = (): Lead[] => {
  const services = ['Roof Repair', 'Full Replacement', 'Gutter Cleaning', 'Inspection', 'Emergency Leak'];
  const names = ['Mike R.', 'Sarah J.', 'Bill T.', 'Amanda L.', 'Chris P.', 'Jessica M.', 'David B.', 'Tom H.'];
  const leads: Lead[] = [];

  // Generate 25 mock leads
  for (let i = 0; i < 25; i++) {
    const isBooked = Math.random() > 0.6;
    const service = services[Math.floor(Math.random() * services.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    
    leads.push({
      id: `demo-l-${i}`,
      name: `${name}`,
      phone: `(555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
      serviceType: service,
      urgency: Math.random() > 0.8 ? 'Emergency' : 'Medium',
      status: isBooked ? 'Booked' : (Math.random() > 0.5 ? 'Qualified' : 'New'),
      dateCaptured: new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)).toLocaleDateString(), // Random date last 10 days
      bookingDate: isBooked ? new Date(Date.now() + Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000)).toISOString() : undefined,
      conversationHistory: generateMockHistory(name, service)
    });
  }
  return leads;
};

export const DEMO_CLIENT: Client = {
  id: 'demo',
  businessName: 'Apex Local Services (Demo)',
  ownerName: 'Future Client',
  email: 'demo@example.com',
  phone: '(555) 123-0000',
  niche: 'Home Services',
  status: 'Active',
  subscriptionTier: '$197/mo',
  mrr: 197,
  avatar: 'https://picsum.photos/205',
  joinedDate: '2023-11-01',
  aiPhoneNumber: '+1 (555) DEMO-NUM',
  forwardingStatus: 'Verified',
  config: {
    enabled: true,
    businessName: 'Apex Local Services',
    niche: 'Home Services',
    customGreeting: 'Thanks for calling Apex. How can we help you today?',
    qualificationQuestions: ['What service do you need?', 'When do you need it done?'],
    voiceEnabled: true,
    voiceId: 'alloy',
    voiceGreeting: 'Thanks for calling Apex. This is our automated assistant. How can I help?'
  },
  leads: generateDemoLeads()
};

export const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    businessName: 'Elite Roofing Pros',
    ownerName: 'Mike Stevens',
    email: 'mike@eliteroofing.local',
    phone: '(555) 123-4567',
    niche: 'Roofing',
    status: 'Active',
    subscriptionTier: '$197/mo',
    mrr: 197,
    avatar: 'https://picsum.photos/200',
    joinedDate: '2023-10-01',
    aiPhoneNumber: '+1 (555) 000-8888',
    forwardingStatus: 'Verified',
    config: {
      enabled: true,
      businessName: 'Elite Roofing Pros',
      niche: 'Roofing',
      customGreeting: 'Thanks for calling Elite Roofing. We are currently on a job. Text us here to schedule a free estimate!',
      qualificationQuestions: ['What type of roof do you have?', 'Is there an active leak?'],
      voiceEnabled: true,
      voiceId: 'alloy',
      voiceGreeting: 'Thanks for calling Elite Roofing. We are currently on a job. How can we help you today?'
    },
    leads: [
      {
        id: 'l1',
        name: 'John Doe',
        phone: '(555) 987-6543',
        serviceType: 'Leak Repair',
        urgency: 'Emergency',
        status: 'Booked',
        dateCaptured: '2023-10-25',
        bookingDate: '2023-10-26T09:00:00.000Z',
        conversationHistory: []
      },
      {
        id: 'l2',
        name: 'Alice Smith',
        phone: '(555) 555-0199',
        serviceType: 'New Roof',
        urgency: 'Medium',
        status: 'Qualified',
        dateCaptured: '2023-10-24',
        conversationHistory: []
      }
    ]
  },
  {
    id: '2',
    businessName: 'ClearWater Pools',
    ownerName: 'Sarah Jenkins',
    email: 'sarah@clearwater.local',
    phone: '(555) 234-5678',
    niche: 'Pool Service',
    status: 'Active',
    subscriptionTier: '$197/mo',
    mrr: 197,
    avatar: 'https://picsum.photos/201',
    joinedDate: '2023-10-15',
    aiPhoneNumber: '+1 (555) 000-7777',
    forwardingStatus: 'Verified',
    config: {
      enabled: true,
      businessName: 'ClearWater Pools',
      niche: 'Pool Service',
      customGreeting: 'Hi! ClearWater Pools here. How can we help keep your pool sparkling today?',
      qualificationQuestions: ['Is this residential or commercial?', 'Do you need weekly maintenance or a repair?'],
      voiceEnabled: false
    },
    leads: []
  },
  {
    id: '3',
    businessName: 'Rapid Response HVAC',
    ownerName: 'David Chen',
    email: 'dave@rapidhvac.local',
    phone: '(555) 345-6789',
    niche: 'HVAC',
    status: 'Onboarding',
    subscriptionTier: '$197/mo',
    mrr: 197,
    avatar: 'https://picsum.photos/202',
    joinedDate: '2023-10-27',
    forwardingStatus: 'Pending Setup',
    config: {
      enabled: false,
      businessName: 'Rapid Response HVAC',
      niche: 'HVAC',
      customGreeting: 'Rapid Response HVAC. Please state your emergency.',
      qualificationQuestions: ['Is your AC unit blowing hot air?', 'How old is your system?'],
      voiceEnabled: false
    },
    leads: []
  },
  {
    id: '4',
    businessName: 'GreenThumb Landscapes',
    ownerName: 'Gary Wilson',
    email: 'gary@greenthumb.local',
    phone: '(555) 456-7890',
    niche: 'Landscaping',
    status: 'Active',
    subscriptionTier: '$197/mo',
    mrr: 197,
    avatar: 'https://picsum.photos/203',
    joinedDate: '2023-09-10',
    aiPhoneNumber: '+1 (555) 000-5555',
    forwardingStatus: 'Verified',
    config: {
      enabled: true,
      businessName: 'GreenThumb Landscapes',
      niche: 'Landscaping',
      customGreeting: 'GreenThumb here. Text us for a quote on lawn care or design.',
      qualificationQuestions: ['What is the approximate square footage?', 'Do you need regular maintenance?'],
      voiceEnabled: true,
      voiceId: 'echo',
      voiceGreeting: 'Thanks for calling GreenThumb Landscapes. How can we help you with your lawn today?'
    },
    leads: [
        {
        id: 'l3',
        name: 'Unknown',
        phone: '(555) 111-2222',
        serviceType: 'Mowing',
        urgency: 'Low',
        status: 'New',
        dateCaptured: '2023-10-28',
        conversationHistory: []
      }
    ]
  }
];
