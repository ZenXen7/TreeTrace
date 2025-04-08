'use client';

import React, { useEffect } from 'react';
import { useTreeStore } from '@/store/useTreeStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tree, TreeNode } from 'react-organizational-chart';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

export default function TreeView() {
  const { members, isLoading, error, fetchFamilyTree } = useTreeStore();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchFamilyTree();
  }, [fetchFamilyTree]);

  const renderFamilyMember = (member: any) => {
    return (
      <Card className="w-[200px] hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg">{member.name}</h3>
          <p className="text-sm text-muted-foreground">{member.relation}</p>
        </CardContent>
      </Card>
    );
  };

  const buildTree = (members: any[]) => {
    const rootMember = members.find(member => !member.parentId);
    if (!rootMember) return null;

    const renderNode = (member: any) => {
      const children = members.filter(m => m.parentId === member.id);

      return (
        <TreeNode label={renderFamilyMember(member)} key={member.id}>
          {children.map(child => renderNode(child))}
        </TreeNode>
      );
    };

    return renderNode(rootMember);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex justify-center mb-8">
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <div className="flex justify-center">
          <Skeleton className="h-[400px] w-[800px]" />
        </div>
      </div>
    );
  }

  if (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: error,
    });
    return null;
  }

  return (
    <div className="p-8">
      <div className="flex justify-center gap-4 mb-8">
        <Button onClick={() => router.push('/dashboard/add-member')}>
          Add Family Member
        </Button>
        <Button variant="outline" onClick={() => router.push('/dashboard/edit-tree')}>
          Edit Tree
        </Button>
      </div>
      
      {members.length > 0 ? (
        <div className="flex justify-center overflow-x-auto">
          <Tree
            lineWidth={'2px'}
            lineColor={'#e2e8f0'}
            lineBorderRadius={'10px'}
            label={renderFamilyMember(members[0])}
          >
            {buildTree(members)}
          </Tree>
        </div>
      ) : (
        <div className="text-center p-8">
          <h2 className="text-2xl font-semibold mb-2">No family members found</h2>
          <p className="text-muted-foreground">Start by adding your first family member</p>
        </div>
      )}
    </div>
  );
}