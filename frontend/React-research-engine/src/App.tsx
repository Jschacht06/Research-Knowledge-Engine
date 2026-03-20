import { useMemo, useState } from 'react'
import {
  Bell,
  BookOpen,
  Calendar,
  FileText,
  FolderTree,
  Grid2x2,
  List,
  ListFilter,
  LogOut,
  Search,
  Settings,
  Upload,
} from 'lucide-react'
import './App.css'

type ViewMode = 'home' | 'dashboard' | 'explore'

type DocCard = {
  topic: string
  topicClass: string
  title: string
  author: string
  date: string
  dateISO: string
  summary: string
}

// Converts dd-mm-yyyy input into a valid Date object, or null when invalid/empty.
function parseDateInput(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const match = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (!match) {
    return null
  }

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const parsed = new Date(year, month - 1, day)

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null
  }

  return parsed
}

// Normalizes ISO date strings into sortable numeric timestamps.
function toTimestamp(dateISO: string): number {
  return new Date(`${dateISO}T00:00:00`).getTime()
}

// Builds a compact avatar letter from the author's last name.
function authorInitial(author: string): string {
  const parts = author.split(' ').filter(Boolean)
  const lastName = parts[parts.length - 1] ?? author
  return lastName.charAt(0).toUpperCase()
}

function App() {
  // Top-level page mode used to switch between landing/dashboard/explore views.
  const [view, setView] = useState<ViewMode>('home')

  // Explore filter states.
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [authorQuery, setAuthorQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'Newest' | 'Oldest'>('Newest')

  // Source dataset used by both dashboard previews and explore search results.
  const recentDocuments = useMemo((): DocCard[] => [
    {
      topic: 'Robotics',
      topicClass: 'topic-robotics',
      title: 'Advanced Path Planning Techniques',
      author: 'Dr. Sarah Mitchell',
      date: 'Mar 10, 2026',
      dateISO: '2026-03-10',
      summary: 'This research investigates novel path planning methods for robot navigation.',
    },
    {
      topic: 'AI / Machine Learning',
      topicClass: 'topic-ai',
      title: 'Machine Learning Approaches for Motion Control',
      author: 'Prof. Michael Chen',
      date: 'Mar 8, 2026',
      dateISO: '2026-03-08',
      summary: 'A comprehensive study on applying deep learning to adaptive control systems.',
    },
    {
      topic: 'Mechatronics',
      topicClass: 'topic-mechatronics',
      title: 'Design and Optimization of Smart Actuators',
      author: 'Dr. Emma Rodriguez',
      date: 'Mar 5, 2026',
      dateISO: '2026-03-05',
      summary: 'This proposal explores innovative actuator design for compact mechatronic devices.',
    },
    {
      topic: 'Sensors',
      topicClass: 'topic-sensors',
      title: 'Novel Sensor Fusion Techniques for Real-time Systems',
      author: 'Dr. Daniel Lee',
      date: 'Mar 3, 2026',
      dateISO: '2026-03-03',
      summary: 'Combining multi-modal sensor streams to improve reliability and latency.',
    },
    {
      topic: 'Energy Systems',
      topicClass: 'topic-energy',
      title: 'Renewable Energy Integration in Industrial Automation',
      author: 'Prof. Linda Park',
      date: 'Feb 27, 2026',
      dateISO: '2026-02-27',
      summary: 'Examines robust architectures for energy-aware industrial automation.',
    },
    {
      topic: 'Control Systems',
      topicClass: 'topic-control',
      title: 'Adaptive Control Strategies for Hybrid Robotics',
      author: 'Dr. James Carter',
      date: 'Feb 20, 2026',
      dateISO: '2026-02-20',
      summary: 'Proposes stable adaptive methods for nonlinear mechatronic platforms.',
    },
    {
      topic: 'Robotics',
      topicClass: 'topic-robotics',
      title: 'Human-Robot Collaboration in Dynamic Assembly Lines',
      author: 'Dr. Olivia Kim',
      date: 'Feb 15, 2026',
      dateISO: '2026-02-15',
      summary: 'Presents adaptive planning for safer and faster collaboration in constrained workcells.',
    },
    {
      topic: 'AI / Machine Learning',
      topicClass: 'topic-ai',
      title: 'Few-shot Learning for Industrial Fault Detection',
      author: 'Prof. Ethan Brown',
      date: 'Feb 9, 2026',
      dateISO: '2026-02-09',
      summary: 'Evaluates lightweight few-shot models for anomaly detection with limited labeled data.',
    },
    {
      topic: 'Mechatronics',
      topicClass: 'topic-mechatronics',
      title: 'Modular Actuator Reliability Under Thermal Stress',
      author: 'Dr. Chloe Martin',
      date: 'Feb 2, 2026',
      dateISO: '2026-02-02',
      summary: 'Benchmarks actuator reliability across thermal cycles and duty profiles.',
    },
  ], [])

  const topicOptions = useMemo(
    () => [
      'Robotics',
      'AI / Machine Learning',
      'Mechatronics',
      'Sensors',
      'Energy Systems',
      'Control Systems',
    ],
    [],
  )

  // Applies all explore filters (topic, author, date range) and then sorting.
  const filteredExploreDocuments = useMemo(() => {
    const from = parseDateInput(fromDate)
    const to = parseDateInput(toDate)
    const query = authorQuery.trim().toLowerCase()

    const filtered = recentDocuments.filter((doc) => {
      const matchesTopic =
        selectedTopics.length === 0 || selectedTopics.includes(doc.topic)
      const matchesAuthor = !query || doc.author.toLowerCase().includes(query)

      const docDate = new Date(`${doc.dateISO}T00:00:00`)
      const matchesFrom = !from || docDate >= from
      const matchesTo = !to || docDate <= to

      return matchesTopic && matchesAuthor && matchesFrom && matchesTo
    })

    const sorted = [...filtered].sort((a, b) => {
      const aTime = toTimestamp(a.dateISO)
      const bTime = toTimestamp(b.dateISO)

      return sortOrder === 'Newest' ? bTime - aTime : aTime - bTime
    })

    return sorted
  }, [authorQuery, fromDate, recentDocuments, selectedTopics, sortOrder, toDate])

  // Toggles inclusion of a topic in the multi-select topic filter.
  function toggleTopic(topic: string) {
    setSelectedTopics((current) =>
      current.includes(topic)
        ? current.filter((item) => item !== topic)
        : [...current, topic],
    )
  }

  // Resets explore filters back to the initial default state.
  function resetExploreFilters() {
    setSelectedTopics([])
    setFromDate('')
    setToDate('')
    setAuthorQuery('')
    setSortOrder('Newest')
  }

  // Public landing page branch.
  if (view === 'home') {
    return (
      <div className="landing-page">
        <header className="landing-header">
          <div className="brand">
            <div className="brand-icon"><FileText size={26} /></div>
            <p>Research Knowledge Engine</p>
          </div>
          <nav className="landing-nav">
            <button type="button" onClick={() => setView('home')}>
              Home
            </button>
            <button type="button" onClick={() => setView('explore')}>
              Explore
            </button>
            <button type="button" onClick={() => setView('dashboard')}>
              About
            </button>
          </nav>
          <div className="landing-actions">
            <button type="button" className="text-link" onClick={() => setView('dashboard')}>
              Login
            </button>
            <button type="button" className="cta-btn" onClick={() => setView('dashboard')}>
              Sign Up
            </button>
          </div>
        </header>

        <section className="hero">
          <h1>Your Research. Organized. Discoverable.</h1>
          <p>
            A shared knowledge base for the VIVES Mechatronics research group.
          </p>
          <div className="hero-buttons">
            <button type="button" className="cta-btn" onClick={() => setView('dashboard')}>
              Get Started
            </button>
            <button type="button" className="outline-btn" onClick={() => setView('explore')}>
              Explore Research
            </button>
          </div>
        </section>

        <section className="feature-grid">
          <article>
            <div className="feature-mark teal"><Upload size={30} /></div>
            <h3>Upload Proposals</h3>
            <p>Easily upload research proposals and documents in PDF or DOCX format with rich metadata.</p>
          </article>
          <article>
            <div className="feature-mark orange"><FolderTree size={30} /></div>
            <h3>Organize by Topic</h3>
            <p>Categorize your work by research topics including Robotics, AI, Mechatronics, and more.</p>
          </article>
          <article>
            <div className="feature-mark violet"><Search size={30} /></div>
            <h3>Discover Related Work</h3>
            <p>Find relevant research from your colleagues with advanced filtering and search.</p>
          </article>
        </section>

        <section className="stats-strip">
          <div>
            <FileText size={32} />
            <strong>120+</strong>
            <span>Documents</span>
          </div>
          <div>
            <Grid2x2 size={32} />
            <strong>15</strong>
            <span>Researchers</span>
          </div>
          <div>
            <BookOpen size={32} />
            <strong>8</strong>
            <span>Research Topics</span>
          </div>
        </section>

        <section className="steps-grid">
          <article>
            <div className="step-index">1</div>
            <div className="step-icon"><Upload size={30} /></div>
            <h4>Upload</h4>
            <p>Upload your research proposal with metadata like topic, authors, and keywords.</p>
          </article>
          <article>
            <div className="step-index">2</div>
            <div className="step-icon"><FolderTree size={30} /></div>
            <h4>Organize</h4>
            <p>Documents are automatically categorized and indexed for easy retrieval.</p>
          </article>
          <article>
            <div className="step-index">3</div>
            <div className="step-icon"><Search size={30} /></div>
            <h4>Discover</h4>
            <p>Search and discover related research from the entire knowledge base.</p>
          </article>
        </section>

        <footer className="landing-footer">
          <section>
            <div className="brand">
              <div className="brand-icon"><FileText size={24} /></div>
              <p>Research Knowledge Engine</p>
            </div>
            <p className="footer-text">
              A shared knowledge base for the VIVES Mechatronics research group to upload, organize, and discover research proposals and documents.
            </p>
          </section>
          <section>
            <h5>Quick Links</h5>
            <button type="button" onClick={() => setView('home')}>Home</button>
            <button type="button" onClick={() => setView('explore')}>Explore</button>
            <button type="button" onClick={() => setView('dashboard')}>Dashboard</button>
            <button type="button" onClick={() => setView('dashboard')}>Upload</button>
          </section>
          <section>
            <h5>Contact</h5>
            <p>VIVES Mechatronics</p>
            <p>research@vives.be</p>
          </section>
        </footer>

        <button type="button" className="cookies-pill">Manage cookies or opt out</button>
      </div>
    )
  }

  // Authenticated workspace branch (dashboard + explore).
  return (
    <div className="workspace-shell">
      <aside className="side-nav">
        <div className="side-brand">
          <div className="brand-icon"><FileText size={24} /></div>
          <p>Research Engine</p>
        </div>

        <div className="profile-card">
          <div className="avatar">JD</div>
          <div>
            <p className="name">Dr. Jane Doe</p>
            <p className="role">Researcher</p>
          </div>
        </div>

        <nav className="side-links">
          <button
            type="button"
            className={view === 'dashboard' ? 'active' : ''}
            onClick={() => setView('dashboard')}
          >
            <Grid2x2 size={22} />
            Dashboard
          </button>
          <button type="button"><FileText size={22} />My Documents</button>
          <button
            type="button"
            className={view === 'explore' ? 'active' : ''}
            onClick={() => setView('explore')}
          >
            <Search size={22} />
            Explore
          </button>
          <button type="button"><Upload size={22} />Upload</button>
          <button type="button"><Settings size={22} />Settings</button>
        </nav>

        <button type="button" className="back-home" onClick={() => setView('home')}>
          <LogOut size={20} />
          Back to Home
        </button>

        <p className="sidebar-cookie">Manage cookies or opt out</p>
      </aside>

      <main className="workspace-main">
        <header className="top-search-bar">
          <div className="search-wrap">
            <Search size={22} />
            <input type="search" placeholder="Search documents, authors, topics..." />
          </div>
          <div className="top-actions">
            <div className="notify-wrap">
              <Bell size={22} />
              <span className="notify-dot"></span>
            </div>
            <div className="avatar small">JD</div>
          </div>
        </header>

        {view === 'dashboard' ? (
          // Dashboard content branch.
          <>
            <section className="welcome-banner">
              <h1>Welcome back, Dr. Jane Doe</h1>
              <p>Wednesday, March 18, 2026</p>
            </section>

            <section className="dashboard-stats">
              <article>
                <p>Total Uploads</p>
                <strong>24</strong>
                <small>+3 this month</small>
                <Upload size={20} className="stat-icon teal" />
              </article>
              <article>
                <p>My Documents</p>
                <strong>18</strong>
                <small>Across 5 topics</small>
                <FileText size={20} className="stat-icon orange" />
              </article>
              <article>
                <p>Research Topics</p>
                <strong>5</strong>
                <small>Active categories</small>
                <BookOpen size={20} className="stat-icon violet" />
              </article>
            </section>

            <section className="section-head">
              <h2>Recent Documents</h2>
              <button type="button">View All</button>
            </section>
            <section className="doc-grid">
              {recentDocuments.slice(0, 3).map((doc) => (
                <article className="doc-card" key={doc.title}>
                  <span className={`topic-pill ${doc.topicClass}`}>{doc.topic}</span>
                  <h3>{doc.title}</h3>
                  <div className="doc-meta">
                    <p>{doc.author}</p>
                    <p>{doc.date}</p>
                  </div>
                  <p>{doc.summary}</p>
                  <button type="button">View Document</button>
                </article>
              ))}
            </section>
          </>
        ) : (
          // Explore content branch with live filtering.
          <div className="explore-layout">
            <aside className="filters-panel">
              <h2><ListFilter size={24} /> Filter</h2>
              <h4>Research Topic</h4>
              {topicOptions.map((topic) => (
                <label key={topic}>
                  <input
                    type="checkbox"
                    checked={selectedTopics.includes(topic)}
                    onChange={() => toggleTopic(topic)}
                  />
                  {topic}
                </label>
              ))}

              <h4>Date Range</h4>
              <div className="date-input-wrap">
                <input
                  type="text"
                  placeholder="dd-mm-yyyy"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
                <Calendar size={18} />
              </div>
              <p className="to-label">to</p>
              <div className="date-input-wrap">
                <input
                  type="text"
                  placeholder="dd-mm-yyyy"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
                <Calendar size={18} />
              </div>

              <h4>Author</h4>
              <input
                type="text"
                placeholder="Search author..."
                value={authorQuery}
                onChange={(event) => setAuthorQuery(event.target.value)}
              />
              <button type="button" className="reset-link" onClick={resetExploreFilters}>
                Reset filters
              </button>
            </aside>

            <section className="explore-results">
              <div className="results-toolbar">
                <select
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(event.target.value as 'Newest' | 'Oldest')
                  }
                >
                  <option>Newest</option>
                  <option>Oldest</option>
                </select>
                <p>{filteredExploreDocuments.length} documents found</p>
                <div className="view-switcher" aria-hidden="true">
                  <button type="button" className="active"><Grid2x2 size={18} /></button>
                  <button type="button"><List size={18} /></button>
                </div>
              </div>

              <div className="doc-grid two-col">
                {filteredExploreDocuments.map((doc) => (
                  <article className="doc-card" key={`${doc.title}-${doc.date}`}>
                    <span className={`topic-pill ${doc.topicClass}`}>{doc.topic}</span>
                    <h3>{doc.title}</h3>
                    <div className="doc-meta">
                      <span className="author-badge">{authorInitial(doc.author)}</span>
                      <p>{doc.author}</p>
                      <span className="meta-dot">&bull;</span>
                      <p>{doc.date}</p>
                    </div>
                    <p>{doc.summary}</p>
                    <button type="button">View Document</button>
                  </article>
                ))}
              </div>

              {filteredExploreDocuments.length === 0 && (
                <p className="empty-results">No documents match the selected filters.</p>
              )}
            </section>
          </div>
        )}

        {view === 'dashboard' && (
          <button type="button" className="floating-add">
            +
          </button>
        )}
      </main>
    </div>
  )
}

export default App
