//Root myDeserializedClass = JsonConvert.DeserializeObject<Root>(myJsonResponse);
using System;
using System.Collections.Generic;

public class Language
{
    public int lesson { get; set; }
    public string start { get; set; }
    public List<List<string>> dialog { get; set; }
    //public string[][] dialog { get; set; }
}
//public class English :Language
//{ 
//}
//public class Spanish
//{
//    public int lesson { get; set; }
//    public string start { get; set; }
//    public List<List<string>> dialog { get; set; }
//}

public class Root
{
    public List<Language> english { get; set; }
    public List<Language> spanish { get; set; }

    //public List<Spanish> spanish { get; set; }
}