"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

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
}

function exportToCSV(members: Member[], conditions: string[]) {
  const header = ['Name', 'Generation', ...conditions];
  const rows = members.map(m => [
    `${m.name} ${m.surname || ''}`.trim(),
    m.generation,
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

  if (loading) return <div className="p-8 text-center text-white">Loading health data...</div>;
  if (members.length === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-black text-white flex flex-col items-center justify-center">
      <div className="text-2xl mb-4">No family members found.</div>
      <Link href="/dashboard/treeview" className="px-6 py-2 bg-teal-600 rounded text-white hover:bg-teal-700">Back to Tree View</Link>
    </div>
  );

  return (
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
                {conditions.map(cond => (
                  <th key={cond} className="border-b border-gray-800 px-6 py-4 text-left font-semibold">{cond.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={2 + conditions.length} className="text-center py-8 text-gray-400">No members found with the selected condition.</td>
                </tr>
              ) : filteredMembers.map(member => (
                <tr key={member._id} className="hover:bg-gray-800/60 transition-colors">
                  <td className="border-b border-gray-800 px-6 py-3 whitespace-nowrap">
                    <span
                      className="underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400 rounded px-1"
                      tabIndex={0}
                      title={`Birthdate: ${member.birthDate || 'N/A'}\nStatus: ${member.status || 'N/A'}`}
                    >
                      {member.name} {member.surname}
                    </span>
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
                  <td className="border-b border-gray-800 px-6 py-3">{member.generation}</td>
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
      </div>
    </div>
  );
} 