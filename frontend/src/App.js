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
import { Upload, Users, Tablet, FileText, Settings, LogOut, Eye, Download, Trash2 } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

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
      const response = await api.post('/api/auth/login', { username, password });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      onLogin();
      toast.success('Successfully logged in!');
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setupAdmin = async () => {
    try {
      const response = await api.post('/api/auth/setup');
      toast.success(response.data.message);
      if (response.data.username) {
        toast.info(`Username: ${response.data.username}, Password: ${response.data.password}`);
      }
    } catch (error) {
      toast.error('Failed to setup admin user');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold">iPad Verwaltung</CardTitle>
          <CardDescription className="text-blue-100">Admin Login</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Benutzername</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              {loading ? 'Anmelden...' : 'Anmelden'}
            </Button>
          </form>
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={setupAdmin} className="w-full">
              Admin-Benutzer einrichten
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// File Upload Component
const FileUpload = ({ onUpload, acceptedTypes, title, description }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      await onUpload(file);
      setFile(null);
      const input = document.querySelector('input[type="file"]');
      if (input) input.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <Input
            type="file"
            accept={acceptedTypes}
            onChange={handleFileChange}
            className="mb-4"
          />
          {file && (
            <div className="text-sm text-gray-600 mb-4">
              Ausgewählte Datei: {file.name}
            </div>
          )}
          <Button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            {uploading ? 'Hochladen...' : 'Datei hochladen'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// iPads Management Component
const IPadsManagement = () => {
  const [ipads, setIPads] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadIPads = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/ipads');
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

    try {
      const response = await api.post('/api/ipads/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message);
      await loadIPads(); // Reload iPads after upload
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Upload fehlgeschlagen');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'verfügbar': 'bg-green-100 text-green-800',
      'zugewiesen': 'bg-blue-100 text-blue-800',
      'defekt': 'bg-red-100 text-red-800',
      'gestohlen': 'bg-gray-100 text-gray-800'
    };
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const statusCounts = ipads.reduce((acc, ipad) => {
    acc[ipad.status] = (acc[ipad.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <FileUpload
        onUpload={handleUpload}
        acceptedTypes=".xlsx"
        title="iPads hochladen"
        description="Excel-Datei mit iPad-Informationen hochladen (.xlsx)"
      />
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tablet className="h-5 w-5" />
            iPads Übersicht ({ipads.length})
          </CardTitle>
          <CardDescription>
            {loading ? 'Lade Daten...' : `${ipads.length} iPads in der Datenbank`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!loading && ipads.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-green-800">Verfügbar</div>
                <div className="text-2xl font-bold text-green-600">{statusCounts.verfügbar || 0}</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-blue-800">Zugewiesen</div>
                <div className="text-2xl font-bold text-blue-600">{statusCounts.zugewiesen || 0}</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-red-800">Defekt</div>
                <div className="text-2xl font-bold text-red-600">{statusCounts.defekt || 0}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-800">Gestohlen</div>
                <div className="text-2xl font-bold text-gray-600">{statusCounts.gestohlen || 0}</div>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Lade iPads...</p>
            </div>
          ) : ipads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Tablet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Keine iPads vorhanden.</p>
              <p className="text-sm">Laden Sie eine Excel-Datei hoch, um iPads hinzuzufügen.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ITNr</TableHead>
                    <TableHead>SNr</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Anschaffungsjahr</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pencil</TableHead>
                    <TableHead>Karton</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ipads.map((ipad) => (
                    <TableRow key={ipad.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{ipad.itnr || 'N/A'}</TableCell>
                      <TableCell>{ipad.snr || 'N/A'}</TableCell>
                      <TableCell>{ipad.typ || 'N/A'}</TableCell>
                      <TableCell>{ipad.ansch_jahr || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(ipad.status)}</TableCell>
                      <TableCell>{ipad.pencil || 'N/A'}</TableCell>
                      <TableCell>{ipad.karton || 'N/A'}</TableCell>
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

// Students Management Component
const StudentsManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/students');
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
      const response = await api.post('/api/students/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message);
      await loadStudents(); // Reload students after upload
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileUpload
        onUpload={handleUpload}
        acceptedTypes=".xlsx"
        title="Schüler hochladen"
        description="Excel-Datei mit Schülerinformationen hochladen (.xlsx)"
      />
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Schüler Übersicht ({students.length})
          </CardTitle>
          <CardDescription>
            {loading ? 'Lade Daten...' : `${students.length} Schüler in der Datenbank`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Lade Schüler...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Keine Schüler vorhanden.</p>
              <p className="text-sm">Laden Sie eine Excel-Datei hoch, um Schüler hinzuzufügen.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vorname</TableHead>
                    <TableHead>Nachname</TableHead>
                    <TableHead>Klasse</TableHead>
                    <TableHead>Ort</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell>{student.sus_vorn || 'N/A'}</TableCell>
                      <TableCell className="font-medium">{student.sus_nachn || 'N/A'}</TableCell>
                      <TableCell>{student.sus_kl || 'N/A'}</TableCell>
                      <TableCell>{student.sus_ort || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={student.current_assignment_id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                          {student.current_assignment_id ? 'Zugewiesen' : 'Verfügbar'}
                        </Badge>
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

// Assignments Management Component
const AssignmentsManagement = () => {
  const [assignments, setAssignments] = useState([]);
  const [ipads, setIPads] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const loadAllData = async () => {
    try {
      const [assignmentsRes, ipadsRes, studentsRes] = await Promise.all([
        api.get('/api/assignments'),
        api.get('/api/ipads'),
        api.get('/api/students')
      ]);
      
      setAssignments(assignmentsRes.data);
      setIPads(ipadsRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleAutoAssign = async () => {
    setAssigning(true);
    try {
      const response = await api.post('/api/assignments/auto-assign');
      toast.success(response.data.message);
      await loadAllData(); // Reload all data after assignment
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Auto-assignment failed');
      console.error('Auto-assignment error:', error);
    } finally {
      setAssigning(false);
    }
  };

  const handleViewAssignment = (assignment) => {
    toast.info(`iPad ${assignment.itnr} ist zugewiesen an ${assignment.student_name}`);
  };

  const handleDeleteAssignment = async (assignment) => {
    if (window.confirm(`Möchten Sie die Zuordnung von iPad ${assignment.itnr} an ${assignment.student_name} wirklich löschen?`)) {
      // This would need a backend endpoint for deletion
      toast.info('Löschfunktion wird in der nächsten Version implementiert');
    }
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
            Aktuelle Zuordnungen ({assignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Lade Zuordnungen...</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Keine Zuordnungen vorhanden. Verwenden Sie die automatische Zuordnung oben.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>iPad ITNr</TableHead>
                    <TableHead>Schüler</TableHead>
                    <TableHead>Zugewiesen am</TableHead>
                    <TableHead>Vertrag</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{assignment.itnr}</TableCell>
                      <TableCell>{assignment.student_name}</TableCell>
                      <TableCell>{new Date(assignment.assigned_at).toLocaleDateString('de-DE')}</TableCell>
                      <TableCell>
                        <Badge className={assignment.contract_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {assignment.contract_id ? 'Vorhanden' : 'Fehlend'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewAssignment(assignment)}
                            title="Details anzeigen"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteAssignment(assignment)}
                            title="Zuordnung löschen"
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

// Contracts Management Component
const ContractsManagement = () => {
  const [unassignedContracts, setUnassignedContracts] = useState([]);
  const [availableAssignments, setAvailableAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadUnassignedContracts = async () => {
    try {
      const response = await api.get('/api/contracts/unassigned');
      setUnassignedContracts(response.data);
    } catch (error) {
      console.error('Failed to load unassigned contracts:', error);
    }
  };

  const loadAvailableAssignments = async () => {
    try {
      const response = await api.get('/api/assignments/available-for-contracts');
      setAvailableAssignments(response.data);
    } catch (error) {
      console.error('Failed to load available assignments:', error);
    }
  };

  useEffect(() => {
    loadUnassignedContracts();
    loadAvailableAssignments();
  }, []);

  const handleMultipleUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    setLoading(true);
    try {
      const response = await api.post('/api/contracts/upload-multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message);
      
      // Show detailed results
      response.data.results.forEach(result => {
        if (result.status === 'assigned') {
          toast.success(`${result.filename}: ${result.message}`);
        } else if (result.status === 'unassigned') {
          toast.info(`${result.filename}: ${result.message}`);
        } else if (result.status === 'error') {
          toast.error(`${result.filename}: ${result.message}`);
        }
      });
      
      await loadUnassignedContracts();
      await loadAvailableAssignments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Contract upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignContract = async (contractId, assignmentId) => {
    try {
      await api.post(`/api/contracts/${contractId}/assign/${assignmentId}`);
      toast.success('Vertrag erfolgreich zugeordnet');
      await loadUnassignedContracts();
      await loadAvailableAssignments();
    } catch (error) {
      toast.error('Fehler bei der Zuordnung des Vertrags');
    }
  };

  return (
    <div className="space-y-6">
      {/* Multiple Upload */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Mehrere Verträge hochladen
          </CardTitle>
          <CardDescription>
            PDF-Verträge gleichzeitig hochladen. Verträge mit Feldern werden automatisch zugeordnet, andere als unzugewiesen markiert.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <Input
              type="file"
              accept=".pdf"
              multiple
              onChange={(e) => handleMultipleUpload(e.target.files)}
              className="mb-4"
              disabled={loading}
            />
            {loading && (
              <div className="text-sm text-gray-600 mb-4">
                Verträge werden hochgeladen und verarbeitet...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unassigned Contracts */}
      {unassignedContracts.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Unzugewiesene Verträge ({unassignedContracts.length})
            </CardTitle>
            <CardDescription>
              Verträge ohne automatische Zuordnung - manuelle Zuweisung erforderlich
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">{contract.filename}</TableCell>
                      <TableCell>{new Date(contract.uploaded_at).toLocaleDateString('de-DE')}</TableCell>
                      <TableCell>
                        <Select onValueChange={(assignmentId) => handleAssignContract(contract.id, assignmentId)}>
                          <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="iPad und Schüler auswählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableAssignments.map((assignment) => (
                              <SelectItem key={assignment.assignment_id} value={assignment.assignment_id}>
                                {assignment.itnr} → {assignment.student_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-orange-100 text-orange-800">Unzugewiesen</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertDescription>
          <strong>Hinweise zum Upload:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Verträge mit ITNr, SuSVorn und SuSNachn werden automatisch zugeordnet</li>
            <li>Verträge ohne diese Felder werden als unzugewiesen markiert</li>
            <li>Unzugewiesene Verträge können manuell über die Dropdown-Liste zugeordnet werden</li>
            <li>Maximal 20 Dateien gleichzeitig hochladbar</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('ipads');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">iPad Verwaltungssystem</h1>
              <p className="text-gray-600">Verwalten Sie iPads, Schüler und Zuordnungen</p>
            </div>
            <Button variant="outline" onClick={onLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg rounded-lg p-1">
            <TabsTrigger value="ipads" className="flex items-center gap-2">
              <Tablet className="h-4 w-4" />
              iPads
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Schüler
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Zuordnungen
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Verträge
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ipads">
            <IPadsManagement />
          </TabsContent>

          <TabsContent value="students">
            <StudentsManagement />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentsManagement />
          </TabsContent>

          <TabsContent value="contracts">
            <ContractsManagement />
          </TabsContent>
        </Tabs>
      </main>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">Lade...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Toaster position="top-right" />
        {isAuthenticated ? (
          <Dashboard onLogout={handleLogout} />
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </div>
    </Router>
  );
}

export default App;