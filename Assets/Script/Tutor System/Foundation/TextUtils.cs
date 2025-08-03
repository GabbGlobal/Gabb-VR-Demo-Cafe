using System.Globalization;
using System.Linq;
using System.Text;

public static class TextUtils
{
    /// <summary>
    /// Removes diacritics (accents) and converts to lowercase.
    /// Example: "Lápiz" => "lapiz"
    /// </summary>
    public static string NormalizeAccents(string input)
    {
        if (string.IsNullOrEmpty(input))
            return string.Empty;

        string normalized = input.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();

        foreach (char c in normalized)
        {
            UnicodeCategory uc = CharUnicodeInfo.GetUnicodeCategory(c);
            if (uc != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }

        return sb.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
    }
}
