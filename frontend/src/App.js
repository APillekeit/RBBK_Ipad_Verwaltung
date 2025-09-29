import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import UI components
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Alert, AlertDescription } from './components/ui/alert';
import { Badge } from './components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { Upload, Users, Tablet, FileText, Settings as SettingsIcon, LogOut, Eye, Download, Trash2, ExternalLink, Shield, AlertTriangle, X, User } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

// API configuration
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login Component
const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post('/auth/login', { username, password });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      onLogin();
      toast.success('Successfully logged in!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const checkSetup = async () => {
    try {
      const response = await api.post('/auth/setup');
      if (response.data.message.includes('Admin user created')) {
        toast.success('Setup completed! Please login with admin/admin123');
      }
    } catch (error) {
      // Setup likely already done
    }
  };

  useEffect(() => {
    checkSetup();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tablet className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            iPad-Verwaltung
          </CardTitle>
          <CardDescription className="text-gray-600">
            Melden Sie sich an, um fortzufahren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Benutzername</Label>
              <Input
                id="username"
                type="text"
                placeholder="Benutzername eingeben"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="Passwort eingeben"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
              disabled={loading}
            >
              {loading ? 'Anmeldung läuft...' : 'Anmelden'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-gray-700 mb-1">Standard-Anmeldedaten:</div>
              <div>Benutzername: <span className="font-mono bg-gray-200 px-1 rounded">admin</span></div>
              <div>Passwort: <span className="font-mono bg-gray-200 px-1 rounded">admin123</span></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// iPad Detail Viewer Component
const IPadDetailViewer = ({ ipadId, onClose }) => {
  const [ipadData, setIPadData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIPadDetails = async () => {
      try {
        const response = await api.get(`/ipads/${ipadId}/history`);
        setIPadData(response.data);
      } catch (error) {
        toast.error('Fehler beim Laden der iPad-Details');
        console.error('iPad details error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (ipadId) {
      loadIPadDetails();
    }
  }, [ipadId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="text-center">Lade iPad-Details...</div>
        </div>
      </div>
    );
  }

  if (!ipadData) {
    return null;
  }

  const { ipad, current_assignment, assignment_history, current_contract, contract_history } = ipadData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              iPad Details: {ipad.itnr}
            </h2>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* iPad Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tablet className="h-5 w-5" />
                iPad Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><strong>ITNr:</strong> {ipad.itnr}</div>
                <div><strong>Modell:</strong> {ipad.modell || 'N/A'}</div>
                <div><strong>Speicher:</strong> {ipad.speicher || 'N/A'}</div>
                <div><strong>Status:</strong> 
                  <Badge className={`ml-2 ${
                    ipad.status === 'verfügbar' ? 'bg-green-100 text-green-800' :
                    ipad.status === 'zugewiesen' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {ipad.status}
                  </Badge>
                </div>
                <div><strong>Hülle:</strong> {ipad.huelle || 'N/A'}</div>
                <div><strong>Stift:</strong> {ipad.stift || 'N/A'}</div>
                <div><strong>Erstellt am:</strong> {ipad.created_at ? new Date(ipad.created_at).toLocaleDateString('de-DE') : 'N/A'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Current Assignment */}
          {current_assignment && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Aktuelle Zuordnung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Schüler:</strong> {current_assignment.student_name}</div>
                    <div><strong>Zugewiesen am:</strong> {new Date(current_assignment.assigned_at).toLocaleDateString('de-DE')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Contract */}
          {current_contract && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Aktueller Vertrag
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm"><strong>Datei:</strong> {current_contract.filename}</div>
                      <div className="text-sm"><strong>Hochgeladen:</strong> {new Date(current_contract.uploaded_at).toLocaleDateString('de-DE')}</div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await api.get(`/contracts/${current_contract.id}/download`, {
                            responseType: 'blob'
                          });
                          const url = window.URL.createObjectURL(new Blob([response.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', current_contract.filename);
                          document.body.appendChild(link);
                          link.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(link);
                        } catch (error) {
                          toast.error('Fehler beim Download');
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignment History */}
          {assignment_history.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Zuordnungshistorie ({assignment_history.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {assignment_history.map((assignment) => (
                    <div key={assignment.id} className={`p-3 rounded-lg text-sm ${assignment.is_active ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-gray-50 border-l-4 border-gray-400'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div><strong>Schüler:</strong> {assignment.student_name}</div>
                          <div><strong>Zugewiesen:</strong> {new Date(assignment.assigned_at).toLocaleDateString('de-DE')}</div>
                          {assignment.unassigned_at && (
                            <div><strong>Aufgelöst:</strong> {new Date(assignment.unassigned_at).toLocaleDateString('de-DE')}</div>
                          )}
                        </div>
                        <Badge className={assignment.is_active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                          {assignment.is_active ? 'Aktiv' : 'Historisch'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contract History */}
          {contract_history.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Vertragshistorie ({contract_history.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {contract_history.map((contract) => (
                    <div key={contract.id} className="p-3 rounded-lg text-sm bg-gray-50 border-l-4 border-gray-400">
                      <div className="flex justify-between items-start">
                        <div>
                          <div><strong>Datei:</strong> {contract.filename}</div>
                          <div><strong>Hochgeladen:</strong> {new Date(contract.uploaded_at).toLocaleDateString('de-DE')}</div>
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-gray-100 text-gray-800">Historisch</Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await api.get(`/contracts/${contract.id}/download`, {
                                  responseType: 'blob'
                                });
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', contract.filename);
                                document.body.appendChild(link);
                                link.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(link);
                              } catch (error) {
                                toast.error('Fehler beim Download');
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose} className="flex-1 md:flex-none">
              Schließen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// iPad Management Component
const IPadsManagement = () => {
  const [ipads, setIPads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedIPadId, setSelectedIPadId] = useState(null);

  const loadIPads = async () => {
    setLoading(true);
    try {
      const response = await api.get('/ipads');
      console.log('iPads API response:', response.data); // Debug log
      setIPads(response.data || []);
    } catch (error) {
      console.error('Failed to load iPads:', error);
      toast.error('Fehler beim Laden der iPads');
      setIPads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIPads();
  }, []);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);

    try {
      const response = await api.post('/ipads/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message);
      response.data.details.forEach(detail => {
        toast.info(detail);
      });
      await loadIPads();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'iPad upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = async (ipadId, newStatus) => {
    try {
      const response = await api.put(`/ipads/${ipadId}/status?status=${newStatus}`);
      toast.success(response.data.message);
      await loadIPads();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Status update failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verfügbar':
        return 'bg-green-100 text-green-800';
      case 'zugewiesen':
        return 'bg-blue-100 text-blue-800';
      case 'defekt':
        return 'bg-red-100 text-red-800';
      case 'gestohlen':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statusCounts = ipads.reduce((acc, ipad) => {
    acc[ipad.status] = (acc[ipad.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            iPads hochladen
          </CardTitle>
          <CardDescription>
            Excel-Datei mit iPad-Daten hochladen (ipads.xlsx Format)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <Input
              type="file"
              accept=".xlsx"
              onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])}
              className="mb-4"
              disabled={uploading}
            />
            {uploading && (
              <div className="text-sm text-gray-600">
                iPads werden hochgeladen und verarbeitet...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tablet className="h-5 w-5" />
            iPad-Status Übersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="font-medium text-green-800">Verfügbar</div>
              <div className="text-2xl font-bold text-green-600">{statusCounts.verfügbar || 0}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="font-medium text-blue-800">Zugewiesen</div>
              <div className="text-2xl font-bold text-blue-600">{statusCounts.zugewiesen || 0}</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="font-medium text-red-800">Defekt</div>
              <div className="text-2xl font-bold text-red-600">{statusCounts.defekt || 0}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="font-medium text-purple-800">Gestohlen</div>
              <div className="text-2xl font-bold text-purple-600">{statusCounts.gestohlen || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tablet className="h-5 w-5" />
            iPads verwalten ({ipads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Lade iPads...</div>
          ) : ipads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Keine iPads vorhanden. Laden Sie zuerst eine Excel-Datei hoch.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ITNr</TableHead>
                    <TableHead>Modell</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Zugewiesen</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ipads.map((ipad) => (
                    <TableRow key={ipad.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{ipad.itnr}</TableCell>
                      <TableCell>{ipad.modell || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ipad.status)}>
                          {ipad.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ipad.current_assignment_id ? (
                          <Badge className="bg-blue-100 text-blue-800">Ja</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Nein</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedIPadId(ipad.id)}
                            title="iPad Details anzeigen"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Select
                            value={ipad.status}
                            onValueChange={(newStatus) => handleStatusChange(ipad.id, newStatus)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="verfügbar">Verfügbar</SelectItem>
                              <SelectItem value="zugewiesen">Zugewiesen</SelectItem>
                              <SelectItem value="defekt">Defekt</SelectItem>
                              <SelectItem value="gestohlen">Gestohlen</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* iPad Detail Viewer Modal */}
      {selectedIPadId && (
        <IPadDetailViewer 
          ipadId={selectedIPadId} 
          onClose={() => setSelectedIPadId(null)} 
        />
      )}
    </div>
  );
};

// Students Management Component
const StudentsManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/students');
      console.log('Students API response:', response.data); // Debug log
      setStudents(response.data || []);
    } catch (error) {
      console.error('Failed to load students:', error);
      toast.error('Fehler beim Laden der Schüler');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);

    try {
      const response = await api.post('/students/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message);
      response.data.details.forEach(detail => {
        toast.info(detail);
      });
      await loadStudents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Student upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteStudent = async (student) => {
    console.log('🗑️ DELETE STUDENT CALLED:', student);
    
    // Double-click protection
    const now = Date.now();
    if (!student._lastDeleteClick || (now - student._lastDeleteClick) > 3000) {
      student._lastDeleteClick = now;
      toast.info(`Schüler ${student.sus_vorn} ${student.sus_nachn} löschen? WARNUNG: Alle Zuordnungen, Historie und Verträge werden gelöscht! Klicken Sie nochmal in 3 Sekunden um zu bestätigen.`);
      return;
    }

    try {
      toast.info('Lösche Schüler und alle zugehörigen Daten...');
      
      const response = await api.delete(`/students/${student.id}`);
      
      toast.success(`${response.data.message}. Gelöscht: ${response.data.deleted_assignments} Zuordnungen, ${response.data.deleted_contracts} Verträge`);
      
      // Reload students list
      await loadStudents();
      
    } catch (error) {
      console.error('Delete student error:', error);
      toast.error(error.response?.data?.detail || 'Fehler beim Löschen des Schülers');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Schüler hochladen
          </CardTitle>
          <CardDescription>
            Excel-Datei mit Schülerdaten hochladen (schildexport.xlsx Format)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <Input
              type="file"
              accept=".xlsx"
              onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])}
              className="mb-4"
              disabled={uploading}
            />
            {uploading && (
              <div className="text-sm text-gray-600">
                Schüler werden hochgeladen und verarbeitet...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Schüler verwalten ({students.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Lade Schüler...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Keine Schüler vorhanden. Laden Sie zuerst eine Excel-Datei hoch.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Klasse</TableHead>
                    <TableHead>iPad-Status</TableHead>
                    <TableHead>Erstellt am</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {student.sus_vorn} {student.sus_nachn}
                      </TableCell>
                      <TableCell>{student.sus_kl || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={student.current_assignment_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {student.current_assignment_id ? 'Zugewiesen' : 'Ohne iPad'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {student.created_at ? new Date(student.created_at).toLocaleDateString('de-DE') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedStudentId(student.id)}
                            title="Schülerdetails anzeigen"
                            className="hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteStudent(student)}
                            title="Schüler löschen (inkl. aller Daten)"
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Detail Viewer Modal */}
      {selectedStudentId && (
        <StudentDetailViewer 
          studentId={selectedStudentId} 
          onClose={() => setSelectedStudentId(null)} 
        />
      )}
    </div>
  );
};

// Contract View Component
const ContractViewer = ({ contractId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    const loadContract = async () => {
      try {
        const response = await api.get(`/contracts/${contractId}`);
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        toast.error('Fehler beim Laden des Vertrags');
        console.error('Contract loading error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (contractId) {
      loadContract();
    }

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [contractId, pdfUrl]);

  const handleDownload = async () => {
    try {
      const response = await api.get(`/contracts/${contractId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contract_${contractId}.pdf`);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      toast.error('Fehler beim Download');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Vertrag anzeigen</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4">Lade Vertrag...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0 rounded"
              title="PDF Viewer"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>Vertrag konnte nicht geladen werden.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Student Detail Viewer Component
const StudentDetailViewer = ({ studentId, onClose }) => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudentDetails = async () => {
      try {
        const response = await api.get(`/students/${studentId}`);
        setStudentData(response.data);
      } catch (error) {
        toast.error('Fehler beim Laden der Schülerdetails');
        console.error('Student details error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      loadStudentDetails();
    }
  }, [studentId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="text-center">Lade Schülerdetails...</div>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return null;
  }

  const { student, current_assignment, assignment_history, contracts } = studentData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Schülerdetails: {student.sus_vorn} {student.sus_nachn}
            </h2>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Student Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Persönliche Daten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><strong>Lfd. Nr:</strong> {student.lfd_nr || 'N/A'}</div>
                <div><strong>Schulname:</strong> {student.sname || 'N/A'}</div>
                <div><strong>Klasse:</strong> {student.sus_kl || 'N/A'}</div>
                <div><strong>Adresse:</strong> {student.sus_str_hnr || 'N/A'}</div>
                <div><strong>PLZ:</strong> {student.sus_plz || 'N/A'}</div>
                <div><strong>Ort:</strong> {student.sus_ort || 'N/A'}</div>
                <div><strong>Geburtsdatum:</strong> {student.sus_geb || 'N/A'}</div>
                <div><strong>Erstellt am:</strong> {student.created_at ? new Date(student.created_at).toLocaleDateString('de-DE') : 'N/A'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Erziehungsberechtigte */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Erziehungsberechtigte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Erziehungsberechtigte/r 1</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Name:</strong> {student.erz1_vorn} {student.erz1_nachn}</div>
                    <div><strong>Adresse:</strong> {student.erz1_str_hnr}</div>
                    <div><strong>PLZ/Ort:</strong> {student.erz1_plz} {student.erz1_ort}</div>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Erziehungsberechtigte/r 2</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Name:</strong> {student.erz2_vorn} {student.erz2_nachn}</div>
                    <div><strong>Adresse:</strong> {student.erz2_str_hnr}</div>
                    <div><strong>PLZ/Ort:</strong> {student.erz2_plz} {student.erz2_ort}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Assignment */}
          {current_assignment && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tablet className="h-5 w-5" />
                  Aktuelle iPad-Zuordnung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>iPad ITNr:</strong> {current_assignment.itnr}</div>
                    <div><strong>Zugewiesen am:</strong> {new Date(current_assignment.assigned_at).toLocaleDateString('de-DE')}</div>
                    <div><strong>Vertrag:</strong> 
                      <Badge className={current_assignment.contract_id ? 'bg-green-100 text-green-800 ml-2' : 'bg-gray-100 text-gray-800 ml-2'}>
                        {current_assignment.contract_id ? 'Vorhanden' : 'Fehlend'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignment History */}
          {assignment_history.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Zuordnungshistorie ({assignment_history.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {assignment_history.map((assignment) => (
                    <div key={assignment.id} className={`p-3 rounded-lg text-sm ${assignment.is_active ? 'bg-green-50 border-l-4 border-green-400' : 'bg-gray-50 border-l-4 border-gray-400'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div><strong>iPad:</strong> {assignment.itnr}</div>
                          <div><strong>Zugewiesen:</strong> {new Date(assignment.assigned_at).toLocaleDateString('de-DE')}</div>
                          {assignment.unassigned_at && (
                            <div><strong>Aufgelöst:</strong> {new Date(assignment.unassigned_at).toLocaleDateString('de-DE')}</div>
                          )}
                        </div>
                        <Badge className={assignment.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {assignment.is_active ? 'Aktiv' : 'Historisch'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contracts */}
          {contracts.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Verträge ({contracts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {contracts.map((contract) => (
                    <div key={contract.id} className={`p-3 rounded-lg text-sm ${contract.is_active ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-gray-50 border-l-4 border-gray-400'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div><strong>Datei:</strong> {contract.filename}</div>
                          <div><strong>iPad:</strong> {contract.itnr || 'Unzugewiesen'}</div>
                          <div><strong>Hochgeladen:</strong> {new Date(contract.uploaded_at).toLocaleDateString('de-DE')}</div>
                        </div>
                        <Badge className={contract.is_active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                          {contract.is_active ? 'Aktiv' : 'Historisch'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose} className="flex-1 md:flex-none">
              Schließen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Assignments Management Component
const AssignmentsManagement = () => {
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [ipads, setIPads] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dissolving, setDissolving] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [uploadingContractForAssignment, setUploadingContractForAssignment] = useState(null);
  
  // Filter states
  const [vornameFilter, setVornameFilter] = useState('');
  const [nachnameFilter, setNachnameFilter] = useState('');
  const [klasseFilter, setKlasseFilter] = useState('');
  const [itnrFilter, setItnrFilter] = useState('');

  const loadAllData = async () => {
    try {
      console.log('Loading all data...'); // Debug log
      const [assignmentsRes, ipadsRes, studentsRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/ipads'),
        api.get('/students')
      ]);
      
      console.log('Assignments loaded:', assignmentsRes.data); // Debug log
      console.log('iPads loaded:', ipadsRes.data); // Debug log
      console.log('Students loaded:', studentsRes.data); // Debug log
      
      setAssignments(assignmentsRes.data);
      setFilteredAssignments(assignmentsRes.data);  
      setIPads(ipadsRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Daten');
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [assignments, vornameFilter, nachnameFilter, klasseFilter, itnrFilter]);

  const applyFilters = async () => {
    console.log('=== APPLYING FILTERS ===');
    console.log('Vorname filter:', vornameFilter);
    console.log('Nachname filter:', nachnameFilter);
    console.log('Klasse filter:', klasseFilter);
    console.log('ITNr filter:', itnrFilter);
    
    if (!vornameFilter && !nachnameFilter && !klasseFilter && !itnrFilter) {
      console.log('No filters active, showing all assignments');
      setFilteredAssignments(assignments);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (vornameFilter) {
        params.append('sus_vorn', vornameFilter);
        console.log('Added vorname filter:', vornameFilter);
      }
      if (nachnameFilter) {
        params.append('sus_nachn', nachnameFilter);
        console.log('Added nachname filter:', nachnameFilter);
      }
      if (klasseFilter) {
        params.append('sus_kl', klasseFilter);
        console.log('Added klasse filter:', klasseFilter);
      }
      if (itnrFilter) {
        params.append('itnr', itnrFilter);
        console.log('Added itnr filter:', itnrFilter);
      }

      const url = `/assignments/filtered?${params.toString()}`;
      console.log('Filter API URL:', url);
      console.log('Full URL:', `${API_BASE_URL}${url}`);

      const response = await api.get(url);
      console.log('Filter API response:', response.data);
      console.log('Number of filtered assignments:', response.data.length);
      
      setFilteredAssignments(response.data);
      
      console.log('Filtered assignments set successfully');
    } catch (error) {
      console.error('=== FILTER ERROR ===');
      console.error('Filter error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error('Fehler beim Filtern der Zuordnungen');
    }
    
    console.log('=== FILTER APPLICATION END ===');
  };

  const handleAutoAssign = async () => {
    setAssigning(true);
    try {
      const response = await api.post('/assignments/auto-assign');
      toast.success(response.data.message);
      await loadAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Auto-Zuordnung fehlgeschlagen');
      console.error('Auto-assignment error:', error);
    } finally {
      setAssigning(false);
    }
  };

  const handleDissolveAssignment = async (assignment) => {
    console.log('🔥 DISSOLUTION FUNCTION CALLED!');
    
    // Simple, working confirmation with setTimeout
    toast.info(`Zuordnung ${assignment.student_name} auflösen? Klicken Sie nochmal in 2 Sekunden um zu bestätigen.`);
    
    // Add a flag to require double-click
    const now = Date.now();
    if (!assignment._lastClick || (now - assignment._lastClick) > 3000) {
      assignment._lastClick = now;
      return; // First click - just show warning
    }
    
    try {
      toast.info('Löse Zuordnung auf...');
      
      const response = await fetch(`${API_BASE_URL}/assignments/${assignment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success('Zuordnung erfolgreich aufgelöst!');
        await loadAllData();
      } else {
        toast.error(`API Fehler: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Exception:', error);
      toast.error(`Fehler: ${error.message}`);
    }
  };

  const handleBatchDissolve = async () => {
    console.log('🔥 BATCH DISSOLUTION FUNCTION CALLED!');
    
    // Double-click protection for batch operations
    const now = Date.now();
    if (!window._lastBatchClick || (now - window._lastBatchClick) > 3000) {
      window._lastBatchClick = now;
      toast.info(`${filteredAssignments.length} gefilterte Zuordnungen auflösen? Klicken Sie nochmal in 2 Sekunden um zu bestätigen.`);
      return;
    }
    
    try {
      setDissolving(true);
      toast.info('Löse alle gefilterten Zuordnungen auf...');
      
      let successCount = 0;
      
      for (const assignment of filteredAssignments) {
        try {
          const response = await fetch(`${API_BASE_URL}/assignments/${assignment.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            successCount++;
          }
        } catch (error) {
          console.error('❌ Error:', error);
        }
      }
      
      toast.success(`${successCount} Zuordnungen erfolgreich aufgelöst!`);
      await loadAllData();
      
    } catch (error) {
      console.error('Batch error:', error);
      toast.error('Batch-Fehler');
    } finally {
      setDissolving(false);
    }
  };

  const handleViewContract = (assignment) => {
    if (assignment.contract_id) {
      setSelectedContractId(assignment.contract_id);
    } else {
      toast.info(`Kein Vertrag für iPad ${assignment.itnr} vorhanden`);
    }
  };

  const handleDismissWarning = async (assignment) => {
    // Double-click protection for warning dismissal
    const now = Date.now();
    if (!assignment._lastWarningClick || (now - assignment._lastWarningClick) > 2000) {
      assignment._lastWarningClick = now;
      toast.info(`Vertragswarnung für ${assignment.student_name} entfernen? Klicken Sie nochmal in 2 Sekunden um zu bestätigen.`);
      return;
    }

    try {
      await api.post(`/assignments/${assignment.id}/dismiss-warning`);
      toast.success('Vertragswarnung entfernt');
      await loadAllData();
    } catch (error) {
      toast.error('Fehler beim Entfernen der Warnung');
      console.error('Warning dismissal error:', error);
    }
  };

  const handleUploadContractForAssignment = async (assignment, file) => {
    if (!file) return;
    
    setUploadingContractForAssignment(assignment.id);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      toast.info(`Lade neuen Vertrag für ${assignment.student_name} hoch...`);
      
      const response = await api.post(`/assignments/${assignment.id}/upload-contract`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(response.data.message);
      
      // Reload assignments to show updated validation status
      await loadAllData();
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Upload des Vertrags');
      console.error('Contract upload error:', error);
    } finally {
      setUploadingContractForAssignment(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get('/assignments/export', {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'zuordnungen_export.xlsx';
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('Export erfolgreich heruntergeladen');
    } catch (error) {
      toast.error('Fehler beim Export');
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setVornameFilter('');
    setNachnameFilter('');
    setKlasseFilter('');
    setItnrFilter('');
  };

  const unassignedStudents = students.filter(student => !student.current_assignment_id);
  const availableIPads = ipads.filter(ipad => ipad.status === 'verfügbar');

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Automatische Zuordnung</CardTitle>
          <CardDescription>
            Weist verfügbare iPads automatisch Schülern ohne iPad zu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-medium text-blue-800">Verfügbare iPads</div>
                <div className="text-2xl font-bold text-blue-600">{availableIPads.length}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="font-medium text-green-800">Schüler ohne iPad</div>
                <div className="text-2xl font-bold text-green-600">{unassignedStudents.length}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="font-medium text-purple-800">Aktuelle Zuordnungen</div>
                <div className="text-2xl font-bold text-purple-600">{assignments.length}</div>
              </div>
            </div>
            <Button 
              onClick={handleAutoAssign}
              disabled={assigning || availableIPads.length === 0 || unassignedStudents.length === 0}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50"
            >
              {assigning ? 'Zuordnung läuft...' : 'Automatische Zuordnung starten'}
            </Button>
            {(availableIPads.length === 0 || unassignedStudents.length === 0) && (
              <p className="text-sm text-gray-600">
                {availableIPads.length === 0 && 'Keine verfügbaren iPads vorhanden. '}
                {unassignedStudents.length === 0 && 'Alle Schüler haben bereits ein iPad. '}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Zuordnungen verwalten ({filteredAssignments.length} von {assignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="vorname">Vorname filtern:</Label>
              <Input
                id="vorname"
                value={vornameFilter}
                onChange={(e) => setVornameFilter(e.target.value)}
                placeholder="z.B. Anna"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="nachname">Nachname filtern:</Label>
              <Input
                id="nachname"
                value={nachnameFilter}
                onChange={(e) => setNachnameFilter(e.target.value)}
                placeholder="z.B. Müller"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="klasse">Klasse filtern:</Label>
              <Input
                id="klasse"
                value={klasseFilter}
                onChange={(e) => setKlasseFilter(e.target.value)}
                placeholder="z.B. 5A"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="itnr">IT-Nummer filtern:</Label>
              <Input
                id="itnr"
                value={itnrFilter}
                onChange={(e) => setItnrFilter(e.target.value)}
                placeholder="z.B. IPAD001"
                className="mt-1"
              />
            </div>
            <div className="flex flex-col justify-end">
              <Button variant="outline" onClick={clearFilters} className="mt-1">
                Filter zurücksetzen
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={handleExport}
              disabled={exporting}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exportiere...' : 'Alle Zuordnungen exportieren'}
            </Button>
            
            {filteredAssignments.length > 0 && filteredAssignments.length < assignments.length && (
              <Button 
                onClick={() => {
                  console.log('🔥 BATCH BUTTON CLICKED!');
                  handleBatchDissolve();
                }}
                disabled={dissolving}
                variant="destructive"
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {dissolving ? 'Löse auf...' : `Gefilterte Zuordnungen auflösen (${filteredAssignments.length})`}
              </Button>
            )}
            
            {/* Debug info for troubleshooting */}
            {(vornameFilter || nachnameFilter || klasseFilter || itnrFilter) && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                Debug: Filter aktiv - Gefiltert: {filteredAssignments.length}, Gesamt: {assignments.length}
                {filteredAssignments.length > 0 && filteredAssignments.length < assignments.length ? ' → Batch-Button verfügbar' : ' → Kein Batch-Button'}
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">Lade Zuordnungen...</div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {assignments.length === 0 
                ? 'Keine Zuordnungen vorhanden. Verwenden Sie die automatische Zuordnung oben.'
                : 'Keine Zuordnungen entsprechen den Filterkriterien.'
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>iPad ITNr</TableHead>
                    <TableHead>Schüler (Klasse)</TableHead>
                    <TableHead>Zugewiesen am</TableHead>
                    <TableHead>Vertrag</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow 
                      key={assignment.id} 
                      className={`hover:bg-gray-50 ${assignment.contract_warning && !assignment.warning_dismissed ? 'bg-orange-50 border-l-4 border-orange-400' : ''}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {assignment.contract_warning && !assignment.warning_dismissed && (
                            <AlertTriangle 
                              className="h-4 w-4 text-orange-500 cursor-pointer hover:text-orange-700" 
                              title="Vertragsvalidierung fehlgeschlagen - Doppelklick zum Entfernen"
                              onClick={() => handleDismissWarning(assignment)}
                            />
                          )}
                          {assignment.itnr}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.student_name}</div>
                          <div className="text-sm text-gray-500">
                            {(() => {
                              const student = students.find(s => s.id === assignment.student_id);
                              return student?.sus_kl ? `Klasse: ${student.sus_kl}` : 'Klasse: N/A';
                            })()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(assignment.assigned_at).toLocaleDateString('de-DE')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={assignment.contract_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {assignment.contract_id ? 'Vorhanden' : 'Fehlend'}
                          </Badge>
                          {assignment.contract_warning && !assignment.warning_dismissed && (
                            <span className="text-xs text-orange-600" title="Validierungsfehler: Nutzung/Kenntnisnahme oder Ausgabe-Option nicht korrekt">
                              ⚠️ Validation
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              console.log('🔵 Eye button clicked for assignment:', assignment);
                              e.preventDefault();
                              e.stopPropagation();
                              handleViewContract(assignment);
                            }}
                            title={assignment.contract_id ? "Vertrag anzeigen" : "Kein Vertrag vorhanden"}
                            className={assignment.contract_id ? "hover:bg-blue-50" : "opacity-50"}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Contract Upload Button - Only show for assignments with validation warnings */}
                          {assignment.contract_warning && !assignment.warning_dismissed && (
                            <div className="relative">
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                  if (e.target.files[0]) {
                                    handleUploadContractForAssignment(assignment, e.target.files[0]);
                                    e.target.value = ''; // Reset input
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={uploadingContractForAssignment === assignment.id}
                              />
                              <Button 
                                variant="outline" 
                                size="sm"
                                title="Neuen korrekten Vertrag hochladen"
                                className="hover:bg-yellow-50 hover:text-yellow-600"
                                disabled={uploadingContractForAssignment === assignment.id}
                              >
                                {uploadingContractForAssignment === assignment.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-600 border-t-transparent"></div>
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              console.log('🗑️ BUTTON CLICKED!', assignment);
                              handleDissolveAssignment(assignment);
                            }}
                            title="Zuordnung auflösen"
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Contract Viewer Modal */}
      {selectedContractId && (
        <ContractViewer 
          contractId={selectedContractId} 
          onClose={() => setSelectedContractId(null)} 
        />
      )}
      
      {/* Confirmation dialog removed for testing */}
    </div>
  );
};

// Contracts Management Component
const ContractsManagement = () => {
  const [unassignedContracts, setUnassignedContracts] = useState([]);
  const [availableAssignments, setAvailableAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contractsRes, assignmentsRes] = await Promise.all([
        api.get('/contracts/unassigned'),
        api.get('/assignments/available-for-contracts')
      ]);
      setUnassignedContracts(contractsRes.data);
      setAvailableAssignments(assignmentsRes.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Vertragsdaten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMultipleUpload = async (files) => {
    if (files.length === 0) return;
    
    // Limit to 50 files as specified in requirements
    if (files.length > 50) {
      toast.error('Maximal 50 Dateien können gleichzeitig hochgeladen werden');
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    
    setUploading(true);
    try {
      const response = await api.post('/contracts/upload-multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(response.data.message);
      if (response.data.details && response.data.details.length > 0) {
        response.data.details.forEach(detail => {
          toast.info(detail);
        });
      }
      
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Upload der Verträge');
    } finally {
      setUploading(false);
    }
  };

  const handleAssignContract = async (contractId, assignmentId) => {
    try {
      await api.post(`/contracts/${contractId}/assign/${assignmentId}`);
      toast.success('Vertrag erfolgreich zugeordnet');
      await loadData();
    } catch (error) {
      toast.error('Fehler bei der Zuordnung');
    }
  };

  const handleDownloadContract = async (contract) => {
    try {
      const response = await api.get(`/contracts/${contract.id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', contract.filename);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      toast.error('Fehler beim Download');
    }
  };

  const handleDeleteContract = async (contract) => {
    // Double-click protection
    const now = Date.now();
    if (!contract._lastDeleteClick || (now - contract._lastDeleteClick) > 3000) {
      contract._lastDeleteClick = now;
      toast.info(`Vertrag ${contract.filename} löschen? Klicken Sie nochmal in 3 Sekunden um zu bestätigen.`);
      return;
    }

    try {
      await api.delete(`/contracts/${contract.id}`);
      toast.success('Vertrag erfolgreich gelöscht');
      await loadData();
    } catch (error) {
      toast.error('Fehler beim Löschen des Vertrags');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Verträge hochladen
          </CardTitle>
          <CardDescription>
            PDF-Verträge hochladen (bis zu 50 Dateien gleichzeitig)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <Input
              type="file"
              accept=".pdf"
              multiple
              onChange={(e) => handleMultipleUpload(Array.from(e.target.files))}
              className="mb-4"
              disabled={uploading}
            />
            {uploading && (
              <div className="text-sm text-gray-600">
                Verträge werden hochgeladen und verarbeitet...
              </div>
            )}
            
            {/* Upload Guidelines */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-left">
              <h4 className="font-medium text-blue-800 mb-2">Upload-Hinweise:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• PDF-Verträge mit Formularfeldern werden automatisch zugeordnet</li>
                <li>• Verträge ohne Felder werden als "unzugewiesen" markiert</li>
                <li>• Maximale Upload-Anzahl: 50 Dateien gleichzeitig</li>
                <li>• Erwartete Felder: ITNr, SuSVorn, SuSNachn</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Unzugewiesene Verträge ({unassignedContracts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Lade Verträge...</div>
          ) : unassignedContracts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Keine unzugewiesenen Verträge vorhanden.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dateiname</TableHead>
                    <TableHead>Hochgeladen am</TableHead>
                    <TableHead>Zuordnung</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassignedContracts.map((contract) => (
                    <TableRow key={contract.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{contract.filename}</TableCell>
                      <TableCell>
                        {new Date(contract.uploaded_at).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell>
                        <Select
                          onValueChange={(assignmentId) => handleAssignContract(contract.id, assignmentId)}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Zuordnung auswählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableAssignments.map((assignment) => (
                              <SelectItem key={assignment.id} value={assignment.id}>
                                {assignment.itnr} → {assignment.student_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadContract(contract)}
                            title="Vertrag herunterladen"
                            className="hover:bg-green-50"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteContract(contract)}
                            title="Vertrag löschen"
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Settings Component
const Settings = () => {
  const [cleaning, setCleaning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({
    ipad_typ: 'Apple iPad',
    pencil: 'ohne Apple Pencil'
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Load global settings on component mount
  useEffect(() => {
    const loadGlobalSettings = async () => {
      try {
        const response = await api.get('/settings/global');
        setGlobalSettings(response.data);
      } catch (error) {
        console.error('Failed to load global settings:', error);
        toast.error('Fehler beim Laden der globalen Einstellungen');
      } finally {
        setLoadingSettings(false);
      }
    };

    loadGlobalSettings();
  }, []);

  const handleSaveGlobalSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await api.put('/settings/global', globalSettings);
      toast.success(response.data.message);
    } catch (error) {
      console.error('Failed to save global settings:', error);
      toast.error('Fehler beim Speichern der globalen Einstellungen');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleInventoryExport = async () => {
    setExporting(true);
    try {
      const response = await api.get('/exports/inventory', {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or create default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'bestandsliste_export.xlsx';
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="(.+)"/);
        if (matches) {
          filename = matches[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('Bestandsliste erfolgreich exportiert');
    } catch (error) {
      console.error('Failed to export inventory:', error);
      toast.error('Fehler beim Exportieren der Bestandsliste');
    } finally {
      setExporting(false);
    }
  };

  const handleInventoryImport = async (file) => {
    if (!file) return;
    
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      toast.info('Importiere Bestandsliste...');
      
      const response = await api.post('/imports/inventory', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(response.data.message);
      
      // Show detailed results if available
      if (response.data.created_count > 0 || response.data.updated_count > 0) {
        toast.info(`Details: ${response.data.created_count} neue iPads, ${response.data.updated_count} aktualisiert`);
      }
      
      // Show errors if any
      if (response.data.errors && response.data.errors.length > 0) {
        response.data.errors.forEach(error => {
          toast.error(error);
        });
      }
      
    } catch (error) {
      console.error('Failed to import inventory:', error);
      toast.error(error.response?.data?.detail || 'Fehler beim Importieren der Bestandsliste');
    } finally {
      setImporting(false);
    }
  };

  const handleDataProtectionCleanup = async () => {
    // Double-click protection
    const now = Date.now();
    if (!window._lastCleanupClick || (now - window._lastCleanupClick) > 3000) {
      window._lastCleanupClick = now;
      toast.info('Datenschutz-Bereinigung starten? WARNUNG: Alle Schüler- und Vertragsdaten älter als 5 Jahre werden gelöscht! Klicken Sie nochmal in 3 Sekunden um zu bestätigen.');
      return;
    }

    setCleaning(true);
    try {
      const response = await api.post('/data-protection/cleanup-old-data');
      toast.success(response.data.message);
      if (response.data.details) {
        response.data.details.forEach(detail => {
          toast.info(detail);
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler bei der Datenschutz-Bereinigung');
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Globale Einstellungen
          </CardTitle>
          <CardDescription>
            Standard-Werte für iPad-Typ und Pencil-Ausstattung
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSettings ? (
            <div className="text-center py-4">Lade Einstellungen...</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ipad_typ">iPad-Typ (Standard)</Label>
                  <Input
                    id="ipad_typ"
                    value={globalSettings.ipad_typ}
                    onChange={(e) => setGlobalSettings({...globalSettings, ipad_typ: e.target.value})}
                    placeholder="z.B. Apple iPad"
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pencil">Pencil-Ausstattung (Standard)</Label>
                  <Input
                    id="pencil"
                    value={globalSettings.pencil}
                    onChange={(e) => setGlobalSettings({...globalSettings, pencil: e.target.value})}
                    placeholder="z.B. ohne Apple Pencil"
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button 
                  onClick={handleSaveGlobalSettings}
                  disabled={savingSettings}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                >
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  {savingSettings ? 'Speichert...' : 'Einstellungen speichern'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Export */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Bestandsliste-Export
          </CardTitle>
          <CardDescription>
            Komplette Bestandsliste aller iPads mit Schülerzuordnungen exportieren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-green-400 bg-green-50 p-4 rounded">
              <h4 className="font-medium text-green-800 mb-2">Bestandsliste-Export (Anforderung 2)</h4>
              <p className="text-sm text-green-700 mb-4">
                Exportiert eine vollständige Excel-Datei mit allen iPads und zugehörigen Schülerdaten. 
                Beinhaltet alle Spalten: Schülerdaten, iPad-Details, Zuordnungsinformationen.
              </p>
              <Button 
                onClick={handleInventoryExport}
                disabled={exporting}
                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exportiert...' : 'Bestandsliste exportieren'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Protection Settings */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Datenschutz-Einstellungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded">
              <h4 className="font-medium text-blue-800 mb-2">Automatisches Daten-Cleanup</h4>
              <p className="text-sm text-blue-700 mb-4">
                Löscht automatisch alle Schüler- und Vertragsdaten, die älter als 5 Jahre sind, 
                um DSGVO-Compliance sicherzustellen.
              </p>
              <Button 
                onClick={handleDataProtectionCleanup}
                disabled={cleaning}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
              >
                <Shield className="h-4 w-4 mr-2" />
                {cleaning ? 'Bereinigung läuft...' : 'Datenschutz-Bereinigung starten'}
              </Button>
            </div>
            
            <div className="border-l-4 border-gray-400 bg-gray-50 p-4 rounded">
              <h4 className="font-medium text-gray-800 mb-2">System-Information</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <div>Version: 1.0.0</div>
                <div>Datenbank: iPadDatabase</div>
                <div>Umgebung: Produktion</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('students');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Tablet className="h-5 w-5 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  iPad-Verwaltung
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <Button variant="outline" onClick={onLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Abmelden
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Schüler
            </TabsTrigger>
            <TabsTrigger value="ipads" className="flex items-center gap-2">
              <Tablet className="h-4 w-4" />
              iPads
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Zuordnungen
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Verträge
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Einstellungen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <StudentsManagement />
          </TabsContent>

          <TabsContent value="ipads">
            <IPadsManagement />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentsManagement />
          </TabsContent>

          <TabsContent value="contracts">
            <ContractsManagement />
          </TabsContent>

          <TabsContent value="settings">
            <Settings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Anwendung...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Toaster richColors position="top-right" />
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <Dashboard onLogout={handleLogout} />
              ) : (
                <Login onLogin={handleLogin} />
              )
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;