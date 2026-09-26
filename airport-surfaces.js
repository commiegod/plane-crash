// Partition overlapping pavement rectangles into disjoint tiles. Higher priority wins.
// UVs remain relative to the original rectangle so textures do not restart at seams.
export function partitionPavement(rectangles){
 const xs=[...new Set(rectangles.flatMap(r=>[r.x-r.w/2,r.x+r.w/2]))].sort((a,b)=>a-b);
 const zs=[...new Set(rectangles.flatMap(r=>[r.z-r.l/2,r.z+r.l/2]))].sort((a,b)=>a-b),tiles=[];
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){
  const x0=xs[i],x1=xs[i+1],z0=zs[j],z1=zs[j+1],x=(x0+x1)/2,z=(z0+z1)/2;
  let owner=-1;for(let k=0;k<rectangles.length;k++){const r=rectangles[k];if(x>r.x-r.w/2&&x<r.x+r.w/2&&z>r.z-r.l/2&&z<r.z+r.l/2&&(owner<0||r.priority>rectangles[owner].priority))owner=k;}
  if(owner>=0)tiles.push({x0,x1,z0,z1,owner});
 }return tiles;
}
