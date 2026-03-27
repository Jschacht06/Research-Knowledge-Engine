export type TopicName =
  | 'Robotics'
  | 'AI / Machine Learning'
  | 'Mechatronics'
  | 'Sensors'
  | 'Energy Systems'
  | 'Control Systems'

export type SortOrder = 'Newest' | 'Oldest'

export type DocumentRecord = {
  topic: TopicName
  title: string
  author: string
  date: string
  dateISO: string
  summary: string
}

export const topicOptions: TopicName[] = [
  'Robotics',
  'AI / Machine Learning',
  'Mechatronics',
  'Sensors',
  'Energy Systems',
  'Control Systems',
]

export const documents: DocumentRecord[] = [
  {
    topic: 'Robotics',
    title: 'Advanced Path Planning Techniques',
    author: 'Dr. Sarah Mitchell',
    date: 'Mar 10, 2026',
    dateISO: '2026-03-10',
    summary: 'This research investigates novel path planning methods for robot navigation.',
  },
  {
    topic: 'AI / Machine Learning',
    title: 'Machine Learning Approaches for Motion Control',
    author: 'Prof. Michael Chen',
    date: 'Mar 8, 2026',
    dateISO: '2026-03-08',
    summary: 'A comprehensive study on applying deep learning to adaptive control systems.',
  },
  {
    topic: 'Mechatronics',
    title: 'Design and Optimization of Smart Actuators',
    author: 'Dr. Emma Rodriguez',
    date: 'Mar 5, 2026',
    dateISO: '2026-03-05',
    summary: 'This proposal explores innovative actuator design for compact mechatronic devices.',
  },
  {
    topic: 'Sensors',
    title: 'Novel Sensor Fusion Techniques for Real-time Systems',
    author: 'Dr. Daniel Lee',
    date: 'Mar 3, 2026',
    dateISO: '2026-03-03',
    summary: 'Combining multi-modal sensor streams to improve reliability and latency.',
  },
  {
    topic: 'Energy Systems',
    title: 'Renewable Energy Integration in Industrial Automation',
    author: 'Prof. Linda Park',
    date: 'Feb 27, 2026',
    dateISO: '2026-02-27',
    summary: 'Examines robust architectures for energy-aware industrial automation.',
  },
  {
    topic: 'Control Systems',
    title: 'Adaptive Control Strategies for Hybrid Robotics',
    author: 'Dr. James Carter',
    date: 'Feb 20, 2026',
    dateISO: '2026-02-20',
    summary: 'Proposes stable adaptive methods for nonlinear mechatronic platforms.',
  },
  {
    topic: 'Robotics',
    title: 'Human-Robot Collaboration in Dynamic Assembly Lines',
    author: 'Dr. Olivia Kim',
    date: 'Feb 15, 2026',
    dateISO: '2026-02-15',
    summary: 'Presents adaptive planning for safer and faster collaboration in constrained workcells.',
  },
  {
    topic: 'AI / Machine Learning',
    title: 'Few-shot Learning for Industrial Fault Detection',
    author: 'Prof. Ethan Brown',
    date: 'Feb 9, 2026',
    dateISO: '2026-02-09',
    summary: 'Evaluates lightweight few-shot models for anomaly detection with limited labeled data.',
  },
  {
    topic: 'Mechatronics',
    title: 'Modular Actuator Reliability Under Thermal Stress',
    author: 'Dr. Chloe Martin',
    date: 'Feb 2, 2026',
    dateISO: '2026-02-02',
    summary: 'Benchmarks actuator reliability across thermal cycles and duty profiles.',
  },
]
