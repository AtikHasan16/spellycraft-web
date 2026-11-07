import { supabase } from "./supabaseClient";
import { toCamel } from "./dataMappers";
import { validateGrammarQuestionBatch } from "../utils/grammarQuestionImport";

export async function getGrammarStats() {
  const { data, error } = await supabase.from("grammar_questions").select("module");
  if (error) throw error;

  const byModule = {};
  for (const question of data || []) {
    const module = question.module || "general";
    byModule[module] = (byModule[module] || 0) + 1;
  }

  return {
    data: {
      success: true,
      totalCount: (data || []).length,
      byModule,
    },
  };
}

export async function getGrammarQuestions(params = {}) {
  const module = params.module;
  const rows = [];
  const pageSize = 500;
  let offset = 0;

  while (true) {
    let query = supabase
      .from("grammar_questions")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (module && module !== "all" && module !== "mixed") {
      if (module === "modifiers-dangling" || module === "run-on-comma-splices") {
        query = query.or(`module.eq.${module},module.eq.modifiers-and-splices`);
      } else {
        query = query.eq("module", module);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    const pageRows = data || [];
    rows.push(...pageRows);
    if (pageRows.length < pageSize) break;
    offset += pageSize;
  }

  return {
    data: {
      success: true,
      count: rows.length,
      data: toCamel(rows),
    },
  };
}

export async function deleteGrammarQuestion(id) {
  const { data, error } = await supabase
    .from("grammar_questions")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error("The question was not deleted. It may have already been removed or access was denied.");
  }
  return { data: { success: true, deletedCount: 1 } };
}

export async function deleteGrammarQuestionGroup(module) {
  const normalizedModule = String(module || "").trim();
  if (!normalizedModule) throw new Error("A grammar module is required.");

  const { count, error } = await supabase
    .from("grammar_questions")
    .delete({ count: "exact" })
    .eq("module", normalizedModule);
  if (error) throw error;
  if (!count) {
    throw new Error("No questions were deleted. The group may already be empty or access was denied.");
  }
  return { data: { success: true, deletedCount: count ?? 0 } };
}

export async function bulkCreateGrammarQuestions(questions) {
  const rows = validateGrammarQuestionBatch(questions);
  const { data, error } = await supabase
    .from("grammar_questions")
    .insert(rows)
    .select("id");
  if (error) throw error;
  if (!Array.isArray(data) || data.length !== rows.length) {
    throw new Error("The database did not confirm every grammar question insert.");
  }

  return {
    data: {
      success: true,
      insertedCount: data.length,
      message: `${data.length} grammar question${data.length === 1 ? "" : "s"} uploaded successfully.`,
    },
  };
}
