import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communitiesAPI } from '../services/api.js';
import { CiSquarePlus } from "react-icons/ci";
import { ImSpinner2, ImCross } from "react-icons/im";
import { FaGlobe } from "react-icons/fa";
import { GrSubtractCircle } from "react-icons/gr"

export default function CommunityPage() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ruleInput, setRuleInput] = useState('');
  const [rules, setRules] = useState([]);
  const qc = useQueryClient();

  const { data: communities, isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: () => communitiesAPI.getAll().then(r => r.data)
  });

  const { mutate: create, isPending } = useMutation({
    mutationFn: () => communitiesAPI.create({ name, description, rules }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communities'] });
      setShowForm(false);
      setName(''); setDescription(''); setRules([]);
    }
  });

  const addRule = () => {
    if (ruleInput.trim()) {
      setRules([...rules, ruleInput.trim()]);
      setRuleInput('');
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Communities</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-2">
          <CiSquarePlus size={15} /> New Community
        </button>
      </div>

      {showForm && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-white">Create Community</h3>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Community name" className="w-full bg-surface border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full bg-surface border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent resize-none" />
          <div>
            <p className="text-xs text-gray-400 mb-2">Community Rules (used by AI for context-aware moderation)</p>
            <div className="flex gap-2 mb-2">
              <input value={ruleInput} onChange={e => setRuleInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRule())} placeholder="Add a rule..." className="flex-1 bg-surface border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent" />
              <button onClick={addRule} className="btn-ghost text-sm">Add</button>
            </div>
            <div className="space-y-1">
              {rules.map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-surface rounded-lg px-3 py-1.5 border border-gray-700/50">
                  <span className="text-xs text-gray-300">{i + 1}. {r}</span>
                  <button onClick={() => setRules(rules.filter((_, j) => j !== i))} className="text-gray-500 hover:text-danger ml-2"><GrSubtractCircle size={16} /></button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => create()} disabled={isPending || !name} className="btn-primary text-sm">
              {isPending ? <ImSpinner2 size={14} className="animate-spin" /> : 'Create'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><ImSpinner2 size={24} className="animate-spin text-accent-light" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities?.map(c => (
            <div key={c.id} className="card">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <FaGlobe size={16} className="text-accent-light" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{c.name}</h3>
                  <p className="text-xs text-gray-500">{c._count?.posts || 0} posts</p>
                </div>
              </div>
              {c.description && <p className="text-xs text-gray-400 mb-3">{c.description}</p>}
              {c.rules?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Rules ({c.rules.length}):</p>
                  <ul className="space-y-0.5">
                    {c.rules.slice(0, 3).map((r, i) => (
                      <li key={i} className="text-xs text-gray-400">• {r}</li>
                    ))}
                    {c.rules.length > 3 && <li className="text-xs text-gray-600">+{c.rules.length - 3} more</li>}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}