
import React, { useEffect, useState } from 'react';
import { getProjects, saveProject, deleteProject, getClients } from '../services/dataService';
import { Project, ProjectStatus, Client } from '../types';
import { Plus, Trash2, Calendar, DollarSign, Search, User } from 'lucide-react';
import { format } from 'date-fns';

const STATUSES: ProjectStatus[] = ['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled'];

export const ProjectList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({});
  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
        setProjects(await getProjects());
        setClients(await getClients());
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const project: Project = {
      id: currentProject.id || crypto.randomUUID(),
      name: currentProject.name!,
      clientName: currentProject.clientName!,
      status: currentProject.status || 'not_started',
      deadline: currentProject.deadline!,
      budget: Number(currentProject.budget) || 0,
      description: currentProject.description || '',
      createdAt: currentProject.createdAt || new Date().toISOString()
    };
    const updated = await saveProject(project);
    setProjects(updated);
    setIsEditing(false);
    setCurrentProject({});
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete project?")) setProjects(await deleteProject(id));
  };

  const openEdit = (p?: Project) => {
    setCurrentProject(p || { status: 'not_started', deadline: new Date().toISOString().split('T')[0] });
    setIsEditing(true);
    setClientSearch('');
  };

  const selectClient = (name: string) => {
      setCurrentProject({...currentProject, clientName: name});
      setIsClientDropdownOpen(false);
  };

  const getStatusColor = (s: string) => {
    switch(s) {
        case 'completed': return 'bg-emerald-100 text-emerald-700';
        case 'in_progress': return 'bg-blue-50 text-blue-700';
        case 'on_hold': return 'bg-amber-50 text-amber-700';
        case 'cancelled': return 'bg-red-50 text-red-700';
        default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Projects</h1>
          <p className="text-gray-500 dark:text-gray-400">Track project status and deadlines</p>
        </div>
        <button onClick={() => openEdit()} className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all font-medium">
          <Plus size={20} /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.length === 0 && <div className="col-span-2 text-center text-gray-400 py-10">No projects yet. Create one!</div>}
        {projects.map(p => (
            <div key={p.id} onClick={() => openEdit(p)} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-primary-300 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold dark:text-white">{p.name}</h3>
                        <p className="text-sm text-gray-500">{p.clientName}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(p.status)}`}>
                        {p.status.replace('_', ' ')}
                    </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{p.description}</p>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={16} /> {format(new Date(p.deadline), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                        <DollarSign size={16} className="text-gray-400" /> {p.budget.toLocaleString()}
                    </div>
                </div>
                <button onClick={(e) => {e.stopPropagation(); handleDelete(p.id);}} className="mt-4 text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                    <Trash2 size={12} /> Delete Project
                </button>
            </div>
        ))}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 dark:text-white">{currentProject.id ? 'Edit Project' : 'New Project'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input type="text" placeholder="Project Name" required className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentProject.name || ''} onChange={e => setCurrentProject({...currentProject, name: e.target.value})} />
              
              {/* Client Selector */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 mb-1">Client</label>
                <div className="relative">
                    <input 
                        type="text" 
                        required 
                        placeholder="Client Name"
                        className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        value={currentProject.clientName || ''} 
                        onChange={e => setCurrentProject({...currentProject, clientName: e.target.value})}
                        onFocus={() => setIsClientDropdownOpen(true)}
                    />
                    {isClientDropdownOpen && (
                        <div className="absolute z-10 top-full left-0 w-full bg-white dark:bg-gray-700 shadow-xl rounded-xl border border-gray-200 dark:border-gray-600 mt-1 p-2">
                            <div className="relative mb-2">
                                <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search clients..." 
                                    className="w-full pl-9 p-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    value={clientSearch}
                                    onChange={e => setClientSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                                {filteredClients.map(c => (
                                    <div key={c.id} onClick={() => selectClient(c.name)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer text-sm dark:text-white">
                                        <div className="font-bold">{c.name}</div>
                                    </div>
                                ))}
                                {filteredClients.length === 0 && <div className="p-2 text-xs text-gray-400 text-center">No clients found</div>}
                            </div>
                             <button type="button" onClick={() => setIsClientDropdownOpen(false)} className="w-full text-center text-xs p-2 text-gray-400 hover:text-gray-600">Close</button>
                        </div>
                    )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Status</label>
                    <select className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentProject.status} onChange={e => setCurrentProject({...currentProject, status: e.target.value as ProjectStatus})}>
                        {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Deadline</label>
                    <input type="date" className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentProject.deadline || ''} onChange={e => setCurrentProject({...currentProject, deadline: e.target.value})} />
                </div>
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Budget</label>
                  <input type="number" className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentProject.budget || 0} onChange={e => setCurrentProject({...currentProject, budget: Number(e.target.value)})} />
              </div>
              <textarea placeholder="Project Description" className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={3} value={currentProject.description || ''} onChange={e => setCurrentProject({...currentProject, description: e.target.value})} />
              
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700">Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
