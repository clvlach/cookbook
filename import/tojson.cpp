#include "cb_database.h"

#include "time.h"
#include "unicode/unistr.h"
#include "json/json.h"
#include <iomanip>
#include <random>
#include <regex>

using Json::Value;

static const char hexDigits[] = "0123456789ABCDEF";

// NOT THREAD SAFE
std::string next_push_id() {
  static const char alphabet[] =
      "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
  static int64_t last_timestamp = 0;
  static unsigned char last_rand[12] = {};
  static std::random_device engine;
  static std::uniform_int_distribution<char> dist(0, 63);
  timespec time;
  assert(0 == clock_gettime(CLOCK_REALTIME, &time));
  int64_t current_timestamp =
      static_cast<int64_t>(time.tv_sec) * 1000 + time.tv_nsec / 1000 / 1000;
  bool duplicate_timestamp = false;
  if (current_timestamp == last_timestamp) {
    duplicate_timestamp = true;
  } else {
    last_timestamp = current_timestamp;
  }
  if (duplicate_timestamp) {
    int i;
    for (i = 11; i >= 0 && last_rand[i] == 63; --i) {
      last_rand[i] = 0;
    }
    if (i >= 0)
      last_rand[i]++;
  } else {
    for (int i = 0; i < 12; ++i) {
      last_rand[i] = dist(engine);
    }
  }

  std::string result;
  result.resize(20);
  for (int i = 7; i >= 0; --i) {
    result[i] = alphabet[current_timestamp % 64];
    current_timestamp /= 64;
  }
  for (int i = 0; i < 12; ++i) {
    result[i + 8] = alphabet[last_rand[i]];
  }
  return result;
}

void maybe_set(Value& val, const char* key, const CB_String& s) {
  if (s.size() == 0)
    return;
  val[key] = s.str();
}
void maybe_append(Value& val, const CB_String& s) {
  if (s.size() == 0)
    return;
  val.append(s.str());
}

std::string lowerCase(const std::string& source) {
  icu::UnicodeString lower = icu::UnicodeString::fromUTF8(source);
  lower.toLower();
  std::string result;
  lower.toUTF8String(result);
  return result;
}

std::string titleCase(const std::string& source) {
  icu::UnicodeString title = icu::UnicodeString::fromUTF8(source);
  title.toTitle(nullptr);
  std::string result;
  title.toUTF8String(result);
  return result;
}

std::string urlFromTitle(const std::string& title) {
  static const std::regex nonAlnum("[^a-z0-9]+");
  std::string lowerTitle = lowerCase(title);
  return std::regex_replace(lowerTitle, nonAlnum, "-");
}

std::string escapeKey(const std::string& unescaped) {
  std::string result;
  for (unsigned char c : unescaped) {
    switch (c) {
    default:
      result += c;
      break;
    // These are the characters disallowed from Firebase keys.
    case '.':
    case '#':
    case '$':
    case '/':
    case '[':
    case ']':
    case '%':  // And the escape character.
      result += '%';
      result += hexDigits[c / 16];
      result += hexDigits[c % 16];
      break;
    }
  }
  return result;
}

Value typedObject(const char* type) {
  Value result(Json::objectValue);
  result["@type"] = type;
  return result;
}

int main(int argc, char** argv) {
  if (argc < 2) {
    std::cout << "Pass the name of the recipe database to this program, "
                 "usually 'Recipe.cbd'.\n";
    exit(0);
  }

  const Value emptyArray(Json::arrayValue);
  const Value emptyObject(Json::objectValue);

  // Counts the number of times a url has been used.
  std::map<std::string, int> urlCounts;
  std::ostringstream titleStream;
  std::ostringstream dateStream;

  CB_Book* book = new CB_Book;
  book->Read(argv[1]);
  Value json_recipes(Json::arrayValue);
  const CB_RecipeMap_t& recipes = book->Get_sortedByName();
  for (auto& elem : recipes) {
    CB_Recipe* const recipe = elem.second;
    Value& recipeJson = json_recipes.append(emptyObject);
    recipeJson["@context"] = "http://schema.org";
    recipeJson["@type"] = "Recipe";
    std::string title = recipe->Get_name().str();
    std::string recipeUrl = urlFromTitle(title);
    if (++urlCounts[recipeUrl] > 1) {
      titleStream.str("");
      titleStream << title << " " << urlCounts[recipeUrl];
      title = titleStream.str();
      recipeUrl = urlFromTitle(title);
    }
    title = titleCase(title);
    recipeJson["name"] = title;
    recipeJson["slug"] = recipeUrl;

    int serves = atoi(recipe->Get_serves().c_str());
    if (serves > 0)
      recipeJson["recipeYield"] =
          recipe->Get_serves().str() + " serving" + (serves == 1 ? "" : "s");
    int month, day, year;
    if (3 ==
        sscanf(recipe->Get_date().c_str(), "%d-%d-%d", &month, &day, &year)) {
      dateStream.str("");
      dateStream << std::setfill('0') << std::setw(4) << year << "-"
                 << std::setw(2) << month << "-" << day;
      recipeJson["dateCreated"] = dateStream.str();
    }

    Value categories = emptyArray;
    maybe_append(categories, recipe->Get_cat1());
    maybe_append(categories, recipe->Get_cat2());
    maybe_append(categories, recipe->Get_cat3());
    maybe_append(categories, recipe->Get_cat4());
    recipeJson["recipeCategory"] = std::move(categories);

    const std::vector<CB_Ingredient*>& ingredients = recipe->Get_ingredients();
    Value& json_ingredients = recipeJson["recipeIngredient"] = emptyArray;
    for (CB_Ingredient* ingredient : ingredients) {
      Value& json_ingredient =
          json_ingredients.append(typedObject("HowToSupply"));
      maybe_set(json_ingredient, "name", ingredient->Get_ingredient());
      if (ingredient->Get_quantity().size() > 0) {
        Value& quantitativeValue = json_ingredient["requiredQuantity"] =
            typedObject("QuantitativeValue");
        quantitativeValue["value"] = ingredient->Get_quantity().str();
        maybe_set(quantitativeValue, "unitText", ingredient->Get_measurement());
      } else if (ingredient->Get_measurement().size() > 0) {
        // Things like "a pinch".
        json_ingredient["requiredQuantity"] =
            ingredient->Get_measurement().str();
      }
      maybe_set(json_ingredient, "description", ingredient->Get_preparation());
    }

    const std::vector<CB_String>& direction_lines = recipe->Get_directions();
    Value& instructions = recipeJson["recipeInstructions"] = emptyArray;
    for (const auto& direction : direction_lines) {
      instructions.append(direction.str());
    }
  }
  Json::StyledStreamWriter("  ").write(std::cout, json_recipes);
}
