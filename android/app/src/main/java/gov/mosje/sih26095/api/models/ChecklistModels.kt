package gov.mosje.sih26095.api.models

import org.json.JSONArray
import org.json.JSONObject

data class RubricItem(
    val id: String,
    val name: String,
    val weight: Int = 20,
    val defaultScore: Int = 80
) {
    companion object {
        fun fromJson(json: JSONObject): RubricItem {
            return RubricItem(
                id = json.optString("id", ""),
                name = json.optString("name", "Rubric"),
                weight = json.optInt("weight", 20),
                defaultScore = json.optInt("defaultScore", 80)
            )
        }
    }
}

data class ChecklistQuestion(
    val id: String,
    val type: String, // text, yes_no, number_range, photo_evidence, rubrics_checklist
    val title: String,
    val description: String? = null,
    val required: Boolean = true,
    // Text options
    val placeholder: String? = null,
    val maxLength: Int = 1000,
    // Yes/No options
    val positiveLabel: String = "Compliant",
    val negativeLabel: String = "Breach",
    val criticalFailure: Boolean = false,
    // Number range options
    val min: Int = 0,
    val max: Int = 100,
    val step: Int = 1,
    val unit: String? = null,
    val targetThreshold: Int? = null,
    // Photo options
    val photoCategory: String = "On-Site Evidence",
    val minPhotos: Int = 1,
    val requireGeotagWatermark: Boolean = true,
    // Rubrics options
    val rubrics: List<RubricItem> = emptyList(),
    val passingScore: Int = 70
) {
    companion object {
        fun fromJson(json: JSONObject): ChecklistQuestion {
            val rubricList = mutableListOf<RubricItem>()
            val rubricsArray = json.optJSONArray("rubrics")
            if (rubricsArray != null) {
                for (i in 0 until rubricsArray.length()) {
                    rubricList.add(RubricItem.fromJson(rubricsArray.getJSONObject(i)))
                }
            }

            return ChecklistQuestion(
                id = json.optString("id", ""),
                type = json.optString("type", "text"),
                title = json.optString("title", "Question"),
                description = if (json.has("description") && !json.isNull("description")) json.getString("description") else null,
                required = json.optBoolean("required", true),
                placeholder = if (json.has("placeholder") && !json.isNull("placeholder")) json.getString("placeholder") else null,
                maxLength = json.optInt("maxLength", 1000),
                positiveLabel = json.optString("positiveLabel", "Compliant"),
                negativeLabel = json.optString("negativeLabel", "Breach"),
                criticalFailure = json.optBoolean("criticalFailure", false),
                min = json.optInt("min", 0),
                max = json.optInt("max", 100),
                step = json.optInt("step", 1),
                unit = if (json.has("unit") && !json.isNull("unit")) json.getString("unit") else null,
                targetThreshold = if (json.has("targetThreshold")) json.optInt("targetThreshold") else null,
                photoCategory = json.optString("photoCategory", "On-Site Evidence"),
                minPhotos = json.optInt("minPhotos", 1),
                requireGeotagWatermark = json.optBoolean("requireGeotagWatermark", true),
                rubrics = rubricList,
                passingScore = json.optInt("passingScore", 70)
            )
        }
    }
}

data class ChecklistForm(
    val title: String,
    val schemeCode: String,
    val category: String,
    val targetFacilityType: String,
    val description: String? = null,
    val questions: List<ChecklistQuestion> = emptyList()
) {
    companion object {
        fun fromJson(json: JSONObject): ChecklistForm {
            val qList = mutableListOf<ChecklistQuestion>()
            val qArray = json.optJSONArray("questions")
            if (qArray != null) {
                for (i in 0 until qArray.length()) {
                    qList.add(ChecklistQuestion.fromJson(qArray.getJSONObject(i)))
                }
            }

            return ChecklistForm(
                title = json.optString("title", "Statutory Checklist"),
                schemeCode = json.optString("schemeCode", "AVYAY"),
                category = json.optString("category", "Surprise Vigilance Audit"),
                targetFacilityType = json.optString("targetFacilityType", "Registered Welfare Institution"),
                description = if (json.has("description") && !json.isNull("description")) json.getString("description") else null,
                questions = qList
            )
        }
    }
}

