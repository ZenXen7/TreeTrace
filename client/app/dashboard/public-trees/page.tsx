'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import FamilyTree from '@balkangraph/familytree.js';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface PublicTreeViewProps {
  nodeBinding: any;
  nodes: any;
}

function PublicFamilyTree({ nodeBinding, nodes }: PublicTreeViewProps) {
  useEffect(() => {
    const treeElement = document.getElementById('public-tree');
    if (!treeElement) return;

    const family = new FamilyTree(treeElement, {
      mode: 'dark',
      nodeBinding,
      nodes,
      nodeCircleMenu: {
        PDFProfile: {
          icon: FamilyTree.icon.pdf(22, 22, '#D1D5DB'),
          text: 'PDF Profile',
          color: '#1F2937',
        },
      },
      showXScroll: false,
      showYScroll: false,
      enableSearch: true,
      enableFilter: false,
      filterBy: [],
      levelSeparation: 100,
      siblingSeparation: 60,
      subtreeSeparation: 80,
      padding: 20,
      orientation: FamilyTree.orientation.top,
      layout: FamilyTree.layout.normal,
      scaleInitial: FamilyTree.match.boundary,
      enableDragDrop: false,
      enablePan: true,
      enableZoom: true,
      anim: { func: FamilyTree.anim.outBack, duration: 200 },
      connectors: {
        type: 'straight',
        style: {
          'stroke-width': '1',
          stroke: '#4B5563',
        },
      },
    });
  }, [nodeBinding, nodes]);

  return null;
}

export default function PublicTreeViewPage() {
  const { userId } = useParams();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treeKey, setTreeKey] = useState(0);

  const nodeBinding = {
    field_0: 'name',
    field_1: 'surname',
    field_2: 'gender',
    field_3: 'status',
    field_4: 'birthDate',
    field_5: 'deathDate',
    field_6: 'country',
    field_7: 'occupation',
    field_8: 'tags',
  };

  useEffect(() => {
    async function fetchPublicTree() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/family-members/public/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch public family tree');
        }

        const result = await response.json();
        setData(result.data);
      } catch (error) {
        console.error('Error fetching public family tree:', error);
        setError(error instanceof Error ? error.message : 'Failed to load family tree');
        toast.error('Failed to load public family tree');
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchPublicTree();
    }
  }, [userId]);

  useEffect(() => {
    setTreeKey(prev => prev + 1);
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <h1 className="text-3xl font-bold mb-8">Public Family Tree</h1>
        
        {data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">This family tree is not publicly available.</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-xl p-4">
            <div id="public-tree" className="w-full h-[700px]"></div>
            <PublicFamilyTree key={treeKey} nodes={data} nodeBinding={nodeBinding} />
          </div>
        )}
      </motion.div>
    </div>
  );
} 