"use client";

import { useState, useEffect } from "react";

interface Repo { id: number; full_name: string; name: string; private: boolean; }
interface Milestone { id: number; title: string; }

export default function BugReportForm() {
  const [bugText, setBugText] = useState("");
  const [generatedMarkdown, setGeneratedMarkdown] = useState("");
  const [isFormatting, setIsFormatting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"idle" | "success" | "error">("idle");
  const [issueUrl, setIssueUrl] = useState("");

  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [isFetchingRepos, setIsFetchingRepos] = useState<boolean>(true);

  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [availableAssignees, setAvailableAssignees] = useState<string[]>([]);
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [availableMilestones, setAvailableMilestones] = useState<Milestone[]>([]);
  
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<number | "">("");

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await fetch('/api/github/repos');
        const data = await res.json();
        if (res.ok && data.repos) {
          setRepos(data.repos);
          if (data.repos.length > 0) setSelectedRepo(data.repos[0].full_name);
        }
      } catch (error) { console.error("Error repos:", error); } 
      finally { setIsFetchingRepos(false); }
    };
    fetchRepos();
  }, []);

  useEffect(() => {
    if (!selectedRepo) return;
    
    const fetchRepoDetails = async () => {
      setIsFetchingDetails(true);
      setSelectedAssignees([]);
      setSelectedLabels([]);
      setSelectedMilestone("");

      try {
        const res = await fetch(`/api/github/details?repo=${encodeURIComponent(selectedRepo)}`);
        const data = await res.json();
        if (res.ok) {
          setAvailableAssignees(data.assignees || []);
          setAvailableLabels(data.labels || []);
          setAvailableMilestones(data.milestones || []);
        }
      } catch (error) {
        console.error("Error detail repo:", error);
      } finally {
        setIsFetchingDetails(false);
      }
    };

    fetchRepoDetails();
  }, [selectedRepo]);

  const toggleSelection = (item: string, currentList: string[], setList: Function) => {
    if (currentList.includes(item)) {
      setList(currentList.filter(i => i !== item));
    } else {
      setList([...currentList, item]);
    }
  };

  const handleFormatWithAI = async () => {
    if (!bugText.trim()) return;
    setIsFormatting(true); setPublishStatus("idle");
    try {
      const res = await fetch("/api/generate", { 
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: bugText }), 
      });
      const data = await res.json();
      if (res.ok) setGeneratedMarkdown(data.markdown);
      else alert(data.error || "Gagal memformat AI.");
    } catch (error) { alert("Error sistem AI."); } 
    finally { setIsFormatting(false); }
  };

  const handlePublish = async () => {
    if (!generatedMarkdown || !selectedRepo) return;
    setIsPublishing(true);
    try {
      const res = await fetch('/api/github', { 
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueText: generatedMarkdown,
          targetRepo: selectedRepo,
          assignees: selectedAssignees,
          labels: selectedLabels,
          milestone: selectedMilestone === "" ? null : selectedMilestone
        }),
      });
      const data = await res.json();
      if (res.ok) { setPublishStatus("success"); setIssueUrl(data.url); } 
      else { setPublishStatus("error"); alert(data.error || "Gagal mempublish."); }
    } catch (error) { setPublishStatus("error"); } 
    finally { setIsPublishing(false); }
  };

  return (
    <div className="w-full max-w-5xl mx-auto text-left flex flex-col gap-6">
      
      {/* 1. Kotak Input Bug */}
      {publishStatus !== "success" && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Describe the Bug:</label>
          <textarea
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-blue-500 text-gray-800 resize-none"
            placeholder="Example: Hey, the submit button on the profile page is broken..."
            value={bugText} onChange={(e) => setBugText(e.target.value)}
            disabled={isFormatting || isPublishing}
          />
          <button
            onClick={handleFormatWithAI} disabled={!bugText.trim() || isFormatting}
            className="mt-4 w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400 transition"
          >
            {isFormatting ? "AI is formatting..." : "Format with AI"}
          </button>
        </div>
      )}

      {/* 2. Hasil Markdown & Panel Metadata */}
      {generatedMarkdown && publishStatus !== "success" && (
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Kolom Kiri: Preview Markdown */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex-1">
             <h3 className="text-lg font-bold text-gray-800 mb-4">Generated Report</h3>
             <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-auto h-96 text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {generatedMarkdown}
            </div>
          </div>

          {/* Kolom Kanan: Pengaturan GitHub (Assignees, Labels, Repo) */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 w-full lg:w-80 flex flex-col gap-5">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">GitHub Properties</h3>
            
            {/* Repo Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Repository</label>
              {isFetchingRepos ? (
                <p className="text-sm text-gray-400">Loading repos...</p>
              ) : (
                <select
                  value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm text-black focus:ring-blue-500" disabled={isPublishing}
                >
                  {repos.map((repo) => (
                    <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>
                  ))}
                </select>
              )}
            </div>

            {isFetchingDetails ? (
              <div className="text-sm text-blue-500 animate-pulse py-4 text-center border border-blue-100 rounded bg-blue-50">Syncing with GitHub...</div>
            ) : (
              <>
                {/* Assignees */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assignees</label>
                  {availableAssignees.length === 0 ? <p className="text-xs text-gray-400 italic">No assignees available.</p> : (
                    <div className="max-h-24 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                      {availableAssignees.map(user => (
                        <label key={user} className="flex items-center gap-2 mb-1 cursor-pointer">
                          <input type="checkbox" checked={selectedAssignees.includes(user)} onChange={() => toggleSelection(user, selectedAssignees, setSelectedAssignees)} className="rounded text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm text-gray-700">{user}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Labels */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Labels</label>
                  {availableLabels.length === 0 ? <p className="text-xs text-gray-400 italic">No labels available.</p> : (
                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                      {availableLabels.map(label => (
                        <label key={label} className="flex items-center gap-2 mb-1 cursor-pointer">
                          <input type="checkbox" checked={selectedLabels.includes(label)} onChange={() => toggleSelection(label, selectedLabels, setSelectedLabels)} className="rounded text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm text-gray-700 truncate">{label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Milestone */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Milestone</label>
                  <select
                    value={selectedMilestone} onChange={(e) => setSelectedMilestone(e.target.value ? Number(e.target.value) : "")}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm text-black focus:ring-blue-500"
                  >
                    <option value="">No milestone</option>
                    {availableMilestones.map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <button
              onClick={handlePublish} disabled={isPublishing || !selectedRepo || isFetchingDetails}
              className="mt-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-blue-300 transition-colors w-full"
            >
              {isPublishing ? "Publishing..." : "Publish to GitHub"}
            </button>
          </div>
        </div>
      )}

      {/* 3. Status Sukses */}
      {publishStatus === "success" && (
        <div className="bg-green-50 p-8 rounded-xl border border-green-200 text-center">
          <h3 className="text-2xl font-bold text-green-800 mb-2">Bug Report Published!</h3>
          <p className="text-green-700 mb-6">Your AI-formatted issue with tags and assignees has been securely posted.</p>
          <div className="flex justify-center gap-4">
            <a href={issueUrl} target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition">View on GitHub</a>
            <button onClick={() => { setBugText(""); setGeneratedMarkdown(""); setPublishStatus("idle"); }} className="bg-white hover:bg-gray-50 text-green-700 font-bold py-2 px-6 rounded-lg border border-green-300 transition">Report Another Bug</button>
          </div>
        </div>
      )}
      
    </div>
  );
}