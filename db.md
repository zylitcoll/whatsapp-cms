1. Install package
Run this command to install the required dependencies.
Details:
npm install @supabase/supabase-js
Code:
File: Code
```
npm install @supabase/supabase-js
```

2. Add files
Copy the following code into your project.
Code:
File: .env.local
```
SUPABASE_URL=https://ydgptitbgzyyjyrwymqv.supabase.co
SUPABASE_KEY=sb_publishable_08Qrr4mbe9AZI9Yx5BS3dA_ruG-rkiV
```

File: src/db/supabase.js
```
1import { createClient } from "@supabase/supabase-js";
2
3const supabaseUrl = import.meta.env.SUPABASE_URL;
4const supabaseKey = import.meta.env.SUPABASE_KEY;
5
6export const supabase = createClient(supabaseUrl, supabaseKey);
```

File: src/pages/index.astro
```
1---
2import { supabase } from '../db/supabase';
3
4const { data, error } = await supabase.from("todos").select('*');
5---
6
7{
8  (
9    <ul>
10      {data.map((entry) => (
11        <li>{entry.name}</li>
12      ))}
13    </ul>
14  )
15}
```

3. Install Agent Skills (Optional)
Agent Skills give AI coding tools ready-made instructions, scripts, and resources for working with Supabase more accurately and efficiently.
Details:
npx skills add supabase/agent-skills
Code:
File: Code
```
npx skills add supabase/agent-skills
```