// app/tree/page.tsx
'use client';

import { useEffect, useState } from 'react';
import useTreeStore from '@/store/useTreeStore';
import { toast } from 'react-hot-toast';

interface FamilyMember {
  _id: string;
  name: string;
  relationship: string;
  children?: string[];
}

interface FamilyTreeNode extends FamilyMember {
  childNodes?: FamilyTreeNode[];
}

interface TreeNodeProps {
  member: FamilyTreeNode;
  level: number;
}

const TreeNode = ({ member, level }: TreeNodeProps) => {
  const { getFamilyTree } = useTreeStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpand = async () => {
    if (!isExpanded && member._id) {
      await getFamilyTree(member._id);
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="ml-4">
      <div 
        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
        onClick={handleExpand}
      >
        <div className="w-4 h-4 flex items-center justify-center">
          {member.children && member.children.length > 0 && (
            <span>{isExpanded ? '▼' : '▶'}</span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-medium">{member.name}</span>
          <span className="text-sm text-gray-500">{member.relationship}</span>
        </div>
      </div>
      {isExpanded && member.childNodes && (
        <div className="border-l-2 border-gray-200 ml-2">
          {member.childNodes.map((child) => (
            <TreeNode key={child._id} member={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function TreeViewPage() {
  const { familyMembers, currentFamilyTree, isLoading, fetchAllFamilyMembers, getFamilyTree } = useTreeStore();
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  useEffect(() => {
    fetchAllFamilyMembers();
  }, []);

  const handleMemberSelect = async (member: FamilyMember) => {
    setSelectedMember(member);
    await getFamilyTree(member._id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Family Tree</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Family Members List */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Family Members</h2>
          <div className="space-y-2">
            {familyMembers.map((member) => (
              <div
                key={member._id}
                className={`p-3 rounded cursor-pointer ${
                  selectedMember?._id === member._id
                    ? 'bg-blue-100'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => handleMemberSelect(member)}
              >
                <div className="font-medium">{member.name}</div>
                <div className="text-sm text-gray-500">{member.relationship}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Family Tree Visualization */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Tree View</h2>
          {currentFamilyTree ? (
            <TreeNode member={currentFamilyTree} level={0} />
          ) : (
            <div className="text-gray-500 text-center py-8">
              Select a family member to view their family tree
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
