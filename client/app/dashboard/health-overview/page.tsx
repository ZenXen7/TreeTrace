"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AIChatSidebar from '@/components/AIChatSidebar';
import AIChatToggle from '@/components/AIChatToggle';
import { AIService } from '@/services/ai.service';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Member {
  _id: string;
  name: string;
  surname?: string;
  fatherId?: string;
  motherId?: string;
  birthDate?: string;
  status?: string;
  generation: number;
  medicalConditions: string[];
  bloodType?: string;
  partnerId?: string | string[];
}

function exportToCSV(members: Member[], conditions: string[]) {
  const header = ['Name', 'Generation', 'Blood Type', ...conditions];
  const rows = members.map(m => [
    `${m.name} ${m.surname || ''}`.trim(),
    m.generation,
    m.bloodType || '',
    ...conditions.map(cond => m.medicalConditions.includes(cond) ? 'Yes' : '')
  ]);
  const csvContent = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'health-overview.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function HealthOverviewPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCondition, setSelectedCondition] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'generation'>('generation');
  const [sortAsc, setSortAsc] = useState(true);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [allFamilyData, setAllFamilyData] = useState<any[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPrompt, setReportPrompt] = useState('');
  const [reportDraft, setReportDraft] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllData() {
      const token = localStorage.getItem('token');
      if (!token) return;
      // 1. Fetch all family members
      const res = await fetch('http://localhost:3001/family-members', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const familyMembers = (await res.json()).data || [];
      // 2. For each member, fetch their medical history
      const allData = await Promise.all(
        familyMembers.map(async (member: any) => {
          let medicalHistory = null;
          try {
            const medRes = await fetch(`http://localhost:3001/medical-history/family-member/${member._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (medRes.ok) {
              medicalHistory = (await medRes.json()).data;
            }
          } catch {}
          return { ...member, medicalHistory };
        })
      );
      setAllFamilyData(allData);
    }
    fetchAllData();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('http://localhost:3001/family-members', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const membersRaw = data.data || [];
        const memberPromises = membersRaw.map(async (member: any) => {
          let medicalConditions: string[] = [];
          let bloodType: string | undefined = undefined;
          try {
            const medRes = await fetch(`http://localhost:3001/medical-history/family-member/${member._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (medRes.ok) {
              const medData = await medRes.json();
              if (medData.data && medData.data.healthConditions) {
                medicalConditions = Object.entries(medData.data.healthConditions)
                  .filter(([_, checked]) => checked)
                  .map(([condition]) => condition);
              }
              if (medData.data && medData.data.bloodType) {
                bloodType = medData.data.bloodType;
              }
            }
          } catch {}
          return {
            _id: member._id,
            name: member.name,
            surname: member.surname,
            fatherId: member.fatherId,
            motherId: member.motherId,
            birthDate: member.birthDate,
            status: member.status,
            generation: 1, // Placeholder, will be calculated below
            medicalConditions,
            bloodType,
            partnerId: member.partnerId,
          };
        });
        let membersWithConditions: Member[] = await Promise.all(memberPromises);
        // Calculate generations
        const memberMap = new Map<string, Member>();
        membersWithConditions.forEach(m => memberMap.set(m._id, m));
        function getGeneration(member: Member, visited = new Set<string>()): number {
          if (visited.has(member._id)) return 1;
          visited.add(member._id);
          let fatherGen = 0, motherGen = 0;
          if (member.fatherId && memberMap.has(member.fatherId)) {
            fatherGen = getGeneration(memberMap.get(member.fatherId)!, visited);
          }
          if (member.motherId && memberMap.has(member.motherId)) {
            motherGen = getGeneration(memberMap.get(member.motherId)!, visited);
          }
          return 1 + Math.max(fatherGen, motherGen);
        }
        membersWithConditions = membersWithConditions.map(m => ({
          ...m,
          generation: getGeneration(m),
        }));
        // Collect all unique conditions
        const allConditions = new Set<string>();
        membersWithConditions.forEach(m => m.medicalConditions.forEach((c: string) => allConditions.add(c)));
        setMembers(membersWithConditions);
        setConditions(Array.from(allConditions));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filtering and sorting
  let filteredMembers = members;
  if (selectedCondition) {
    filteredMembers = filteredMembers.filter(m => m.medicalConditions.includes(selectedCondition));
  }
  filteredMembers = [...filteredMembers].sort((a, b) => {
    if (sortBy === 'generation') {
      return sortAsc ? a.generation - b.generation : b.generation - a.generation;
    } else {
      const nameA = `${a.name} ${a.surname || ''}`.toLowerCase();
      const nameB = `${b.name} ${b.surname || ''}`.toLowerCase();
      if (nameA < nameB) return sortAsc ? -1 : 1;
      if (nameA > nameB) return sortAsc ? 1 : -1;
      return 0;
    }
  });

  async function handleGenerateReport() {
    setReportLoading(true);
    setReportError(null);
    try {
      const ai = AIService.getInstance();
      // Instruct AI not to use bold or markdown formatting, and to structure the report clearly
      const prompt = `${reportPrompt}\n\nPlease do NOT use bold, markdown, or special formatting. Structure the report clearly with section headers, bullet points, and paragraphs as appropriate. Do not use ** or any markdown.`;
      const draft = await ai.askGemini(prompt, allFamilyData);
      setReportDraft(draft);
    } catch (err: any) {
      setReportError('Failed to generate report. Please try again.');
    } finally {
      setReportLoading(false);
    }
  }

  function exportReportAsPDF() {
    const doc = new jsPDF();
    const logoUrl = '/logo.jpg'; 
    const companyName = 'TreeTrace';
    const reportTitle = 'Custom Health Report';
    const now = new Date();
    const dateString = now.toLocaleString();
    let author = '';
    if (typeof window !== 'undefined') {
      author = localStorage.getItem('userName') || '';
    }
    let y = 18;
    const img = new Image();
    img.src = logoUrl;
    img.onload = function() {
      doc.addImage(img, 'PNG', 14, 10, 24, 24);
      doc.setFontSize(18);
      doc.text(companyName, 42, 22);
      doc.setFontSize(16);
      doc.text(reportTitle, 14, 42);
      doc.setFontSize(10);
      doc.text(`Date: ${dateString}`, 160, 16, { align: 'right' });
      if (author) doc.text(`Author: ${author}`, 160, 22, { align: 'right' });
      y = 52;
      addReportContent();
    };
    img.onerror = function() {
      doc.setFontSize(18);
      doc.text(companyName, 14, 22);
      doc.setFontSize(16);
      doc.text(reportTitle, 14, 42);
      doc.setFontSize(10);
      doc.text(`Date: ${dateString}`, 160, 16, { align: 'right' });
      if (author) doc.text(`Author: ${author}`, 160, 22, { align: 'right' });
      y = 52;
      addReportContent();
    };
    if (img.complete) {
      img.onload();
    }
    function addReportContent() {
      doc.setFontSize(12);
      const sections = reportDraft.split(/\n\n|(?=\n[A-Z][^\n]+:)/g);
      let page = 1;
      sections.forEach(section => {
        const lines = doc.splitTextToSize(section.trim(), 180);
        lines.forEach((line: string) => {
          doc.text(line, 14, y);
          y += 7;
        });
        y += 3;
        if (y > 270) {
          addFooter(page++);
          doc.addPage();
          y = 18;
        }
      });
      addFooter(page);
      doc.save('health-report.pdf');
    }
    function addFooter(pageNum: number) {
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text('This report is for informational purposes only and does not constitute medical advice. For personalized advice, consult a qualified healthcare professional.', 14, 285, { maxWidth: 180 });
      doc.text(`Page ${pageNum}`, 200, 290, { align: 'right' });
      doc.setTextColor(0);
    }
  }

  if (loading) return <div className="p-8 text-center text-white">Loading health data...</div>;
  if (members.length === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-black text-white flex flex-col items-center justify-center">
      <div className="text-2xl mb-4">No family members found.</div>
      <Link href="/dashboard/treeview" className="px-6 py-2 bg-teal-600 rounded text-white hover:bg-teal-700">Back to Tree View</Link>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-black text-white font-sans relative">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-10 pointer-events-none z-0" />
        <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
          {/* Back Button */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <Link href="/dashboard/treeview" className="inline-flex items-center text-teal-400 hover:text-teal-200 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              Back to Tree View
            </Link>
            <div className="flex items-center gap-2">
              <label htmlFor="conditionFilter" className="text-gray-300 text-sm">Filter by Condition:</label>
              <select
                id="conditionFilter"
                className="bg-gray-800 text-white rounded px-3 py-1"
                value={selectedCondition}
                onChange={e => setSelectedCondition(e.target.value)}
              >
                <option value="">All</option>
                {conditions.map(cond => (
                  <option key={cond} value={cond}>{cond.replace(/([A-Z])/g, ' $1')}</option>
                ))}
              </select>
              <button
                className="ml-4 px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700"
                onClick={() => exportToCSV(filteredMembers, conditions)}
              >
                Export CSV
              </button>
            </div>
          </div>
          <div className="mb-4 text-gray-300 text-base max-w-2xl">
            This overview helps you visualize which family members have specific health conditions, making it easier to spot hereditary patterns and health risks across generations.
          </div>
          <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-800/50 bg-gray-900/70">
            <table className="min-w-full text-white text-base">
              <thead className="sticky top-0 bg-gray-900/80 z-20 select-none">
                <tr>
                  <th
                    className="border-b border-gray-800 px-6 py-4 text-left font-semibold cursor-pointer hover:text-teal-400"
                    onClick={() => {
                      setSortBy('name');
                      setSortAsc(sortBy !== 'name' ? true : !sortAsc);
                    }}
                    aria-sort={sortBy === 'name' ? (sortAsc ? 'ascending' : 'descending') : undefined}
                  >
                    Member {sortBy === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="border-b border-gray-800 px-6 py-4 text-left font-semibold">Parents</th>
                  <th className="border-b border-gray-800 px-6 py-4 text-left font-semibold">Partner</th>
                  <th
                    className="border-b border-gray-800 px-6 py-4 text-left font-semibold cursor-pointer hover:text-teal-400"
                    onClick={() => {
                      setSortBy('generation');
                      setSortAsc(sortBy !== 'generation' ? true : !sortAsc);
                    }}
                    aria-sort={sortBy === 'generation' ? (sortAsc ? 'ascending' : 'descending') : undefined}
                  >
                    Generation {sortBy === 'generation' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="border-b border-gray-800 px-6 py-4 text-left font-semibold">Blood Type</th>
                  {conditions.map(cond => (
                    <th key={cond} className="border-b border-gray-800 px-6 py-4 text-left font-semibold">{cond.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={2 + conditions.length + 1} className="text-center py-8 text-gray-400">No members found with the selected condition.</td>
                  </tr>
                ) : filteredMembers.map(member => (
                  <tr key={member._id} className="hover:bg-gray-800/60 transition-colors">
                    <td className="border-b border-gray-800 px-6 py-3 whitespace-nowrap">
                      <Link
                        href={`/dashboard/medical-history/${member._id}`}
                        className="underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400 rounded px-1"
                        tabIndex={0}
                        title={`Birthdate: ${member.birthDate || 'N/A'}\nStatus: ${member.status || 'N/A'}`}
                      >
                        {member.name} {member.surname}
                      </Link>
                    </td>
                    <td className="border-b border-gray-800 px-6 py-3 whitespace-nowrap text-gray-300">
                      {(() => {
                        const father = members.find(m => m._id === member.fatherId);
                        const mother = members.find(m => m._id === member.motherId);
                        const fatherName = father ? `${father.name} ${father.surname || ''}`.trim() : '';
                        const motherName = mother ? `${mother.name} ${mother.surname || ''}`.trim() : '';
                        if (fatherName && motherName) return `${fatherName} / ${motherName}`;
                        if (fatherName) return fatherName;
                        if (motherName) return motherName;
                        return 'Unknown';
                      })()}
                    </td>
                    <td className="border-b border-gray-800 px-6 py-3 whitespace-nowrap text-gray-300">
                      {(() => {
                        const partnerIds = Array.isArray(member.partnerId) ? member.partnerId : member.partnerId ? [member.partnerId] : [];
                        if (!partnerIds.length) return 'No partner';
                        const partnerNames = partnerIds.map(pid => {
                          const partner = members.find(m => m._id === pid);
                          return partner ? `${partner.name} ${partner.surname || ''}`.trim() : '';
                        }).filter(Boolean);
                        return partnerNames.length ? partnerNames.join(' / ') : 'No partner';
                      })()}
                    </td>
                    <td className="border-b border-gray-800 px-6 py-3">{member.generation}</td>
                    <td className="border-b border-gray-800 px-6 py-3 text-center whitespace-nowrap">
                      {member.bloodType || ''}
                    </td>
                    {conditions.map(cond => (
                      <td key={cond} className="border-b border-gray-800 px-6 py-3 text-center align-middle">
                        <div className="flex justify-center items-center h-full w-full min-h-[24px] min-w-[24px]">
                          {member.medicalConditions.includes(cond) ? (
                            <span className="text-teal-400 text-2xl leading-none">✔️</span>
                          ) : null}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center mb-4 mt-10">
            <div className="flex flex-col items-center">
              <button
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 shadow cursor-pointer"
                onClick={() => setShowReportModal(true)}
                title="Generate a detailed health report based on your chosen criteria or questions."
              >
                Create Custom Health Report
              </button>
            </div>
          </div>
        </div>
      </div>
      <AIChatSidebar
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        allFamilyData={allFamilyData}
        title="Health Medical Expert"
      />
      <AIChatToggle
        onClick={() => setIsAIChatOpen(!isAIChatOpen)}
        isOpen={isAIChatOpen}
      />
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 rounded-xl shadow-lg p-8 max-w-2xl w-full relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-teal-400"
              onClick={() => setShowReportModal(false)}
              aria-label="Close"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-4 text-teal-300">Generate Health Report</h2>
            <label className="block mb-2 text-gray-300">Describe the report you want to generate:</label>
            <textarea
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 mb-4"
              rows={3}
              value={reportPrompt}
              onChange={e => setReportPrompt(e.target.value)}
              placeholder="e.g. Summarize all members with hypertension and their generations."
            />
            <div className="flex gap-2 mb-4">
              <button
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                onClick={handleGenerateReport}
                disabled={reportLoading || !reportPrompt.trim()}
              >
                {reportLoading ? 'Generating...' : 'Generate Draft'}
              </button>
              <button
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                onClick={() => { setReportPrompt(''); setReportDraft(''); }}
                disabled={reportLoading}
              >
                Clear
              </button>
            </div>
            {reportError && <div className="text-red-400 mb-2">{reportError}</div>}
            {reportDraft && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-teal-200 mb-2">Draft Report</h3>
                <pre className="bg-gray-800 p-4 rounded text-white whitespace-pre-wrap max-h-80 overflow-y-auto border border-gray-700">{reportDraft}</pre>
                <div className="flex gap-2 mt-4">
                  <button
                    className="px-4 py-2 bg-teal-700 text-white rounded hover:bg-teal-800"
                    onClick={handleGenerateReport}
                    disabled={reportLoading}
                  >
                    Regenerate
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    onClick={exportReportAsPDF}
                  >
                    Export as PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} 