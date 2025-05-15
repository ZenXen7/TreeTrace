import React, { useState, useEffect } from 'react';
import { 
  getHealthConditions, 
  addHealthCondition, 
  updateHealthCondition, 
  removeHealthCondition 
} from '../app/dashboard/main/services/healthConditionService';
import { HealthCondition } from '../src/types/health-condition';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { AlertCircle, Plus, Trash } from 'lucide-react';

interface HealthConditionsProps {
  familyMemberId: string;
}

export default function HealthConditions({ familyMemberId }: HealthConditionsProps) {
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCondition, setNewCondition] = useState<Partial<HealthCondition>>({
    conditionName: '',
    diagnosisDate: undefined,
    notes: '',
  });

  useEffect(() => {
    if (familyMemberId) {
      fetchHealthConditions();
    }
  }, [familyMemberId]);

  const fetchHealthConditions = async () => {
    try {
      setIsLoading(true);
      const conditions = await getHealthConditions(familyMemberId);
      setHealthConditions(conditions);
      setError(null);
    } catch (err) {
      setError('Failed to load health conditions');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCondition = async () => {
    try {
      if (!newCondition.conditionName) {
        setError('Condition name is required');
        return;
      }

      const condition = await addHealthCondition(familyMemberId, newCondition);
      setHealthConditions([...healthConditions, condition]);
      setNewCondition({
        conditionName: '',
        diagnosisDate: undefined,
        notes: '',
      });
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      setError('Failed to add health condition');
      console.error(err);
    }
  };

  const handleDeleteCondition = async (id: string) => {
    try {
      await removeHealthCondition(id);
      setHealthConditions(healthConditions.filter(condition => condition._id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete health condition');
      console.error(err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCondition({
      ...newCondition,
      [name]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Health Conditions</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="h-4 w-4 mr-1" /> 
          Add Condition
        </Button>
      </div>

      {error && (
        <div className="flex items-center p-2 bg-red-50 text-red-600 rounded-md mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Health Condition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="conditionName">Condition Name</Label>
                <Input
                  id="conditionName"
                  name="conditionName"
                  value={newCondition.conditionName}
                  onChange={handleInputChange}
                  placeholder="Enter condition name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosisDate">Diagnosis Date</Label>
                <Input
                  id="diagnosisDate"
                  name="diagnosisDate"
                  type="date"
                  value={newCondition.diagnosisDate instanceof Date 
                    ? newCondition.diagnosisDate.toISOString().split('T')[0] 
                    : newCondition.diagnosisDate as string || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={newCondition.notes || ''}
                  onChange={handleInputChange}
                  placeholder="Enter any additional notes"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button onClick={handleAddCondition}>Save</Button>
          </CardFooter>
        </Card>
      )}

      {isLoading ? (
        <div className="py-8 text-center">Loading health conditions...</div>
      ) : healthConditions.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No health conditions recorded</div>
      ) : (
        <div className="space-y-3">
          {healthConditions.map((condition) => (
            <Card key={condition._id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{condition.conditionName}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteCondition(condition._id)}
                    className="h-8 w-8 p-0 text-red-500"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                {condition.diagnosisDate && (
                  <CardDescription>
                    Diagnosed: {new Date(condition.diagnosisDate).toLocaleDateString()}
                  </CardDescription>
                )}
              </CardHeader>
              {condition.notes && (
                <CardContent>
                  <p className="text-sm text-gray-600">{condition.notes}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 