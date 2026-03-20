"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type Availability = "available" | "maybe" | "unavailable";

interface Candidate {
  id: string;
  start_time: string;
  end_time: string;
}

interface Vote {
  candidate_id: string;
  availability: Availability;
}

interface ResponseData {
  id: string;
  respondent_name: string;
  respondent_email: string;
  comment: string;
  proposal_votes: { candidate_id: string; availability: Availability }[];
}

export default function ScheduleProposalPage() {
  const params = useParams();
  const id = params.id as string;

  const [proposal, setProposal] = useState<any>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [votes, setVotes] = useState<Record<string, Availability>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/proposals?id=${id}`);
        const data = await res.json();
        setProposal(data.proposal);
        setCandidates(data.candidates || []);
        setResponses(data.responses || []);

        // 初期値：全候補を未選択状態に
        const initialVotes: Record<string, Availability> = {};
        (data.candidates || []).forEach((c: Candidate) => {
          initialVotes[c.id] = "unavailable";
        });
        setVotes(initialVotes);
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleSubmit = async () => {
    if (!name || !email) return;
    setSubmitting(true);

    try {
      const voteArray = Object.entries(votes).map(([candidate_id, availability]) => ({
        candidate_id,
        availability,
      }));

      await fetch("/api/proposals/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal_id: id,
          respondent_name: name,
          respondent_email: email,
          votes: voteArray,
          comment,
        }),
      });

      setSubmitted(true);
    } catch {
      // error
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVote = (candidateId: string) => {
    setVotes((prev) => {
      const current = prev[candidateId];
      const next: Availability =
        current === "unavailable"
          ? "available"
          : current === "available"
          ? "maybe"
          : "unavailable";
      return { ...prev, [candidateId]: next };
    });
  };

  const getVoteStyle = (availability: Availability) => {
    switch (availability) {
      case "available":
        return "bg-green-500 text-white border-green-500";
      case "maybe":
        return "bg-yellow-400 text-white border-yellow-400";
      case "unavailable":
        return "bg-gray-100 text-gray-400 border-gray-200";
    }
  };

  const getVoteIcon = (availability: Availability) => {
    switch (availability) {
      case "available":
        return "○";
      case "maybe":
        return "△";
      case "unavailable":
        return "×";
    }
  };

  // 各候補のサマリーを計算
  const getCandidateSummary = (candidateId: string) => {
    let available = 0,
      maybe = 0,
      unavailable = 0;
    responses.forEach((r) => {
      const vote = r.proposal_votes.find((v) => v.candidate_id === candidateId);
      if (vote) {
        if (vote.availability === "available") available++;
        else if (vote.availability === "maybe") maybe++;
        else unavailable++;
      }
    });
    return { available, maybe, unavailable };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">この提案は見つかりません</p>
      </div>
    );
  }

  if (proposal.status === "confirmed") {
    const confirmedCandidate = candidates.find(
      (c) => c.id === proposal.confirmed_candidate_id
    );
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">日程が確定しました</h2>
          {confirmedCandidate && (
            <div className="bg-gray-50 rounded-xl p-4 mt-4">
              <p className="font-bold text-gray-900">
                {format(new Date(confirmedCandidate.start_time), "yyyy年M月d日(E)", { locale: ja })}
              </p>
              <p className="text-gray-600">
                {format(new Date(confirmedCandidate.start_time), "HH:mm")} -{" "}
                {format(new Date(confirmedCandidate.end_time), "HH:mm")}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center animate-fadeIn">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">回答を送信しました</h2>
          <p className="text-gray-600 text-sm">
            {proposal.type === "confirmation"
              ? "日程が確定次第、ご連絡いたします。"
              : "全員の回答が揃い次第、主催者が日程を確定します。"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              proposal.type === "voting"
                ? "bg-purple-100 text-purple-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {proposal.type === "voting" ? "投票型" : "確認型"}
            </span>
          </div>
          <h1 className="text-lg font-bold text-gray-900">{proposal.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            主催: {proposal.users?.name}
            {proposal.description && ` / ${proposal.description}`}
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* 回答者情報 */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">お名前 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="山田 太郎"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">メール *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="taro@example.com"
              />
            </div>
          </div>
        </div>

        {/* 操作説明 */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 px-1">
          <span className="flex items-center gap-1">
            <span className="w-5 h-5 bg-green-500 text-white rounded flex items-center justify-center text-xs">○</span>
            参加可能
          </span>
          <span className="flex items-center gap-1">
            <span className="w-5 h-5 bg-yellow-400 text-white rounded flex items-center justify-center text-xs">△</span>
            未定
          </span>
          <span className="flex items-center gap-1">
            <span className="w-5 h-5 bg-gray-100 text-gray-400 rounded flex items-center justify-center text-xs">×</span>
            参加不可
          </span>
          <span className="text-gray-400 ml-auto">クリックで切替</span>
        </div>

        {/* 候補日一覧 */}
        <div className="space-y-2 mb-4">
          {candidates.map((candidate) => {
            const summary = getCandidateSummary(candidate.id);
            const startDate = new Date(candidate.start_time);
            const endDate = new Date(candidate.end_time);

            return (
              <div
                key={candidate.id}
                className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4"
              >
                <button
                  onClick={() => toggleVote(candidate.id)}
                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition ${getVoteStyle(
                    votes[candidate.id] || "unavailable"
                  )}`}
                >
                  {getVoteIcon(votes[candidate.id] || "unavailable")}
                </button>

                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {format(startDate, "M/d(E)", { locale: ja })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                  </p>
                </div>

                {/* 他の回答者の集計 */}
                {responses.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    {summary.available > 0 && (
                      <span className="text-green-600">○{summary.available}</span>
                    )}
                    {summary.maybe > 0 && (
                      <span className="text-yellow-600">△{summary.maybe}</span>
                    )}
                    {summary.unavailable > 0 && (
                      <span className="text-gray-400">×{summary.unavailable}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* コメント */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <label className="block text-xs font-medium text-gray-500 mb-1">コメント（任意）</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            placeholder="メッセージがあればどうぞ"
          />
        </div>

        {/* 既存回答者一覧（投票型の場合） */}
        {proposal.type === "voting" && responses.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3">回答済み ({responses.length}人)</h3>
            <div className="space-y-2">
              {responses.map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                    {r.respondent_name.charAt(0)}
                  </div>
                  <span className="text-gray-700">{r.respondent_name}</span>
                  <div className="flex gap-1 ml-auto">
                    {candidates.map((c) => {
                      const vote = r.proposal_votes.find(
                        (v) => v.candidate_id === c.id
                      );
                      return (
                        <span
                          key={c.id}
                          className={`w-5 h-5 rounded text-xs flex items-center justify-center ${getVoteStyle(
                            vote?.availability || "unavailable"
                          )}`}
                        >
                          {getVoteIcon(vote?.availability || "unavailable")}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 送信ボタン */}
        <button
          onClick={handleSubmit}
          disabled={!name || !email || submitting}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? "送信中..." : "回答を送信"}
        </button>
      </div>
    </div>
  );
}
